CREATE TABLE IF NOT EXISTS tenant_module_adoptions (
  id          VARCHAR(64)  PRIMARY KEY,
  tenant_id   VARCHAR(128) NOT NULL,
  module_id   VARCHAR(128) NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  mandatory   boolean      NOT NULL DEFAULT false,
  sort_order  int          NOT NULL DEFAULT 0,
  targeting   JSONB        NOT NULL DEFAULT '{}',
  adopted_at  bigint       NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tma_tenant_module ON tenant_module_adoptions(tenant_id, module_id);
