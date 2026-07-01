-- infra 频道：AI 云原生周报。ALTER TYPE ADD VALUE 基本不可回退。
-- 只加值、不在同事务使用，Postgres 12+ 可执行。所有 claim_for_*/*_commit RPC
-- 形参是 channel_kind，加值后自动支持 infra，无需改 RPC。
alter type channel_kind add value if not exists 'infra';
