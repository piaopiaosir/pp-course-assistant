# Token 自动拉黑流程图

```mermaid
flowchart TD
    Start([Token 请求]) --> Verify{Token 是否已拉黑?<br/>is_blacklisted === 1}

    Verify -->|是| RejectBlack([返回 403: 次数已用完])
    Verify -->|否| CheckBalance{余额 < 1?<br/>remaining_count < 1}

    CheckBalance -->|是| AutoBlack1[自动拉黑<br/>is_blacklisted = 1<br/>remaining_count = 0]
    CheckBalance -->|否| ModeSplit{请求模式?}

    AutoBlack1 --> RejectBlack

    ModeSplit -->|普通模式| Decrement[扣减次数<br/>decrementCount]
    ModeSplit -->|AI/校验模式| PreLock[预锁定次数<br/>lockToken]

    %% ========== 普通模式 ==========
    Decrement --> DecrCheck{扣减后余额<br/>< 0.1?}
    DecrCheck -->|是| BlackDecr[拉黑<br/>remaining_count = 0<br/>is_blacklisted = 1]
    DecrCheck -->|否| DecrOK([返回成功 + 剩余次数])
    BlackDecr --> DecrEnd([返回: justBlacklisted = true])

    %% ========== AI/校验模式 ==========
    PreLock --> LockCheck{余额 >= 锁定次数?}
    LockCheck -->|否| LockFail([返回失败: 余额不足])
    LockCheck -->|是| LockOK[扣除预锁定次数<br/>记录 lockedTokens]
    LockOK --> CallAI[调用 AI API]

    CallAI --> AIResult{AI 调用结果?}

    AIResult -->|系统异常| ReleaseSys[releaseToken<br/>isSystemError = true<br/>退还预锁定次数]
    ReleaseSys --> ReleaseEnd([返回失败])

    AIResult -->|用户中断| ReleaseUser[releaseToken<br/>isSystemError = false<br/>不退还次数]
    ReleaseUser --> ReleaseEnd2([返回失败])

    AIResult -->|成功| Settle[settleToken 结算<br/>diff = lockCount - actualCost]

    Settle --> SettleDiff{diff 值?}

    SettleDiff -->|diff = 0| SettleOK([无需操作, 返回余额])
    SettleDiff -->|diff > 0 退还| Refund[退还多余次数<br/>remaining_count += diff]
    SettleDiff -->|diff < 0 补扣| ExtraDeduct[补扣不足次数<br/>remaining_count -= extraCost]

    Refund --> SettleOK2([返回成功 + 剩余次数])

    ExtraDeduct --> ExtraCheck{补扣是否成功?<br/>affectedRows > 0?}

    ExtraCheck -->|否: 余额不足| CurBalance{当前余额 < 0.1?}
    CurBalance -->|是| BlackSettle1[拉黑<br/>remaining_count = 0<br/>is_blacklisted = 1]
    CurBalance -->|否| SettleFail([返回失败:<br/>剩余次数不足,<br/>不扣减不拉黑])
    BlackSettle1 --> BlackEnd1([返回失败 + 拉黑])

    ExtraCheck -->|是| AfterCheck{补扣后余额 < 0.1?}
    AfterCheck -->|是| BlackSettle2[拉黑<br/>remaining_count = 0<br/>is_blacklisted = 1]
    AfterCheck -->|否| SettleOK3([返回成功 + 剩余次数])
    BlackSettle2 --> BlackEnd2([返回成功 + 拉黑])

    %% ========== 解封途径 ==========
    classDef blacklist fill:#ff6b6b,stroke:#c0392b,color:#fff
    classDef success fill:#51cf66,stroke:#27ae60,color:#fff
    classDef decision fill:#ffd43b,stroke:#f59f00,color:#000
    classDef process fill:#74c0fc,stroke:#228be6,color:#fff

    class BlackDecr,BlackSettle1,BlackSettle2,AutoBlack1 blacklist
    class DecrOK,SettleOK,SettleOK2,SettleOK3,SettleFail success
    class Verify,CheckBalance,DecrCheck,LockCheck,SettleDiff,ExtraCheck,CurBalance,AfterCheck,ModeSplit decision
    class Decrement,PreLock,LockOK,CallAI,Settle,Refund,ExtraDeduct,ReleaseSys,ReleaseUser process
```

## 拉黑触发条件汇总

| 场景 | 触发条件 | 返回 |
|------|----------|------|
| checkTokenStatus | `is_blacklisted === 1` 或 `remaining_count < 1` | success: false, isBlacklisted: true |
| decrementCount 扣减后归零 | 扣减后 `finalCount < 0.1` | success: true, justBlacklisted: true |
| settleToken 补扣不足+归零 | 余额不足以补扣 且 `curCount < 0.1` | success: false, 拉黑 |
| settleToken 补扣成功后归零 | 补扣后 `afterCount < 0.1` | success: true, 拉黑 |

## 解封途径

- **福利领取**：`is_blacklisted === 1 && remaining_count < 0.1` 时，领取福利自动解封 + 加次数
- **每晚 0 点**：只重置 `remaining_count = 0`，**不解除黑名单**

## 补扣不足但不拉黑

- 余额 >= 0.1 但不足以补扣差额 → `success: false`，不扣减，不拉黑，保留原余额
