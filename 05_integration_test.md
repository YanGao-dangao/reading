# Task 05：集成测试与冒烟用例（可选）

**索引引用**：[plan_01/README.md](../README.md) 任务 5

---

## 1. 目标与范围

- **目标**：对扫码报名链路中 Task 01～04、06～07 已落地能力做集成测试与冒烟验证，保证「二维码生成 → 配置查询 → 提交（完成节点）→ 内容详情 → 神访报名去重 → 活动可报名校验」可回归。
- **范围**：后端接口/应用服务 + 仓储 + 真实测试库；外部系统（app-build-api、camunda）使用 Mock 或测试环境服务。
- **不在范围**：不覆盖小程序端扫码与渲染、不覆盖布局设计器前端交互。

---

## 2. 测试入口与前置数据

| 项 | 说明 |
| --- | --- |
| **入口** | `POST /lowcode/runtime/app/qrcode/generate`；`GET /lowcode/runtime/app/form/config/detail`；`POST /lowcode/runtime/app/form/data/submit`；`GET /lowcode/runtime/app/form/data/detail`；`POST /lowcode/runtime/app/store-visit/register`；`GET /lowcode/runtime/app/store-visit/check-register` |
| **依赖服务** | `app-build-api /wechat/qrcode/path`（Feign）；`app-build-camunda /task/complete`（Feign） |
| **前置数据** | 可用 `releaseAppId`、`formKey`、`workflowTemplateKey`、`workflowTemplateNodeUuid`；至少 1 个主表单，且可选含 RelatedQuery 指向关联表单；至少 1 条活动 `lc_form_data`（用于 rowDataId/bizKey） |
| **隔离** | 每个用例使用独立业务 key 或独立表单数据；断言后按需逻辑删除或复用测试库隔离数据 |

---

## 3. 集成测试用例清单（IT-01～IT-17）

### 3.1 二维码生成（Task 01）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-01** | 生成二维码成功 | 调 `POST /qrcode/generate`，传 `appId、qrcodeType=MINI_PROGRAM、targetPage、formKey、rowDataId(存在且有bizKey)`；Mock Feign 返回 base64 | 200；`data.qrcodeImageBase64` 非空；query 中含 `formKey、rowDataId、processInstanceId` |
| **IT-02** | 非法 qrcodeType | 同上，`qrcodeType=OTHER` | 4xx 或 failed；错误信息含仅支持 MINI_PROGRAM |
| **IT-03** | rowDataId 不存在或无 bizKey | 传不存在 rowDataId（或 bizKey 为空记录） | 返回失败（业务异常） |

### 3.2 配置详情（Task 02）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-04** | 主表含关联表，默认返回关联配置 | 调 `GET /form/config/detail?appId=&formKey=`；主表字段含 RelatedQuery + relationFormKey | 200；`relatedFormConfigs` 非空，且 key 命中关联 formKey |
| **IT-05** | 主表无关联字段 | 调 detail（主表无 RelatedQuery） | 200；`relatedFormConfigs` 为空 map |

### 3.3 提交详情（Task 03）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-06** | 按 formDataId 查询成功 | 先准备 1 条 `lc_form_data`，再调 `GET /form/data/detail?formDataId=` | 200；返回 `formDataId/formKey/content/bizKey` 与库一致 |
| **IT-07** | formDataId 不存在 | 传不存在 id | failed（当前实现返回 failed，不是 404） |

### 3.4 完成节点提交（Task 04）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-08** | isStartProcess=false 完成节点成功 | 调 `POST /form/data/submit`，传 `isStartProcess=false、workflowTemplateNodeUuid、processInstanceId、content`；Mock camunda complete 成功 | 200；`/task/complete` 被调用（`taskDefKey=nodeUuid`）；`lc_form_data` 新增记录 |
| **IT-09** | 完成节点缺 processInstanceId | 同 IT-08，但不传 `processInstanceId` | failed；提示 processInstanceId 不能为空 |
| **IT-10** | 仅保存不走流程分支 | `isStartProcess=false` 且 `workflowTemplateKey/workflowTemplateNodeUuid` 为空 | 200；不调用 camunda；仍保存一条表单记录 |

### 3.5 神访报名去重与覆盖（Task 06）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-11** | 首次报名提交新增记录 | 调 `POST /store-visit/register`，传 `releaseAppId、formKey、content、userUniqueId、relatedFormDataId` | 200；`lc_form_data` 新增 1 条，`user_unique_id` 与 `parent_id` 正确 |
| **IT-12** | 重复报名触发覆盖 | 连续两次调用相同 `userUniqueId + relatedFormDataId`，第二次 content 不同 | 两次均 200；库中仍 1 条记录；content 为第二次内容 |
| **IT-13** | 不同维度不去重 | 变更 `userUniqueId` 或 `relatedFormDataId` 后提交 | 200；新增新记录（总条数增加） |

### 3.6 神访活动报名校验（Task 07）

| 用例编号 | 场景简述 | 步骤与数据 | 预期 |
| --- | --- | --- | --- |
| **IT-14** | 活动记录不存在 | 调 `GET /store-visit/check-register?activityFormDataId=不存在` | 200；`canRegister=false`，`reason=NOT_FOUND` |
| **IT-15** | 活动已终止（门店或模板 name 缺失） | 准备活动记录 content，门店或模板字段对象缺 name/为空 | 200；`canRegister=false`，`reason=TERMINATED` |
| **IT-16** | 活动未开始/已结束 | 准备日期区间字段（`DatePicker.RangePicker`）分别覆盖未来开始、过去结束 | 200；分别返回 `NOT_STARTED`、`ENDED` |
| **IT-17** | 活动可报名 | 准备有效日期区间且门店/模板 name 完整 | 200；`canRegister=true`，`reason=SUCCESS` |

---

## 4. 冒烟顺序用例（Smoke）

| 编号 | 冒烟链路 | 通过标准 |
| --- | --- | --- |
| **SM-01** | 二维码生成 -> 配置详情 | 全链路 200，无 5xx/NPE；二维码返回结构完整 |
| **SM-02** | 配置详情 -> 提交（完成节点）-> 提交详情 | 全链路 200；提交后可查询到最新内容；完成节点调用参数正确 |
| **SM-03** | 神访报名提交（两次）-> 报名校验 | 首次新增、重复覆盖生效；校验接口返回与活动状态一致 |

---

## 5. 实现任务清单（建议顺序）

| 序号 | 任务 | 说明 |
| --- | --- | --- |
| 1 | 测试骨架 | 新建集成测试类，加载 Spring 上下文与 `test` 配置 |
| 2 | 外部依赖 Mock | mock `WeChatQrCodeFeignClient`、`ModelEngineFeignClient`（必要方法） |
| 3 | 二维码用例 | 实现 IT-01～IT-03 |
| 4 | 配置详情用例 | 实现 IT-04～IT-05 |
| 5 | 提交详情用例 | 实现 IT-06～IT-07 |
| 6 | 完成节点用例 | 实现 IT-08～IT-10 |
| 7 | 神访去重用例 | 实现 IT-11～IT-13 |
| 8 | 神访校验用例 | 实现 IT-14～IT-17 |
| 9 | 冒烟链路 | 实现 SM-01～SM-03，确保无 5xx/NPE |

---

## 6. 业务边界与注意事项

- **范围内**：Task 01～04、06～07 的接口行为、关键字段、Feign 调用参数、落库结果。
- **范围外**：小程序端扫码解析、前端渲染、真实微信 API 可用性。
- **一致性说明**：`data/detail` 不存在记录按当前实现断言 `failed`；`config/detail` 断言默认返回 `relatedFormConfigs`。
- **非功能重点**：避免循环写库（本任务写库断言以单次 save/saveBatch 为主）。

---

## 7. 测试情况汇报（已执行）

| 项 | 结果 | 说明 |
| --- | --- | --- |
| 测试骨架 | 已完成 | `SpringBootTest + profile=test`；新增 `StoreVisitPlanIntegrationTest`、`StoreVisitControllerIntegrationTest` |
| 二维码（IT-01～IT-03） | 已完成 | 覆盖成功、非法类型、rowDataId 不存在（业务失败码） |
| 配置详情（IT-04～IT-05） | 已完成 | 覆盖有关联配置返回与无关联空 map 返回 |
| 提交详情（IT-06～IT-07） | 已完成 | 覆盖存在与不存在场景（不存在断言 failed） |
| 完成节点（IT-08～IT-10） | 已完成 | 覆盖完成节点调用、缺参失败、仅保存不走 complete |
| 神访去重（IT-11～IT-13） | 已完成 | 覆盖首次新增、重复覆盖、变更 parentId 不去重 |
| 神访校验（IT-14～IT-17） | 已完成 | 覆盖 NOT_FOUND / TERMINATED / NOT_STARTED / ENDED / SUCCESS |
| 冒烟（SM-01～SM-03） | 已完成 | 通过两类测试组合覆盖主链路：二维码 -> 配置/提交/详情 -> 报名去重 -> 报名校验 |

### 7.1 本地执行结果（2026-02-10）

- 执行命令：`mvn -pl app-build-form "-Dtest=StoreVisitPlanIntegrationTest,StoreVisitControllerIntegrationTest" test`
- 结果摘要：`Tests run: 15, Failures: 0, Errors: 0, Skipped: 0`
