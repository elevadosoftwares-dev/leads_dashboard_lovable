-- Workspace (app launcher) - SQL Server schema.
-- Applied automatically when the app first connects (src/server/db.server.ts), after creating
-- the database if needed. Safe to re-run: every object is created only if it does not exist.
-- Separate batches with a line containing only GO. To apply by hand:
--   sqlcmd -S <server> -U <user> -P <password> -d new_leads_dashboard -i database/schema.sql

SET NOCOUNT ON;

-- Administrators who can sign in and manage the app tiles.
IF OBJECT_ID(N'dbo.users', N'U') IS NULL
CREATE TABLE dbo.users (
  id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT pk_users PRIMARY KEY DEFAULT NEWID(),
  email         NVARCHAR(320)    NOT NULL CONSTRAINT uq_users_email UNIQUE,
  password_hash NVARCHAR(256)    NOT NULL,
  created_at    DATETIME2(3)     NOT NULL CONSTRAINT df_users_created_at DEFAULT SYSUTCDATETIME()
);

-- Login sessions. token_hash is the SHA-256 of the random token kept in the browser cookie.
IF OBJECT_ID(N'dbo.sessions', N'U') IS NULL
CREATE TABLE dbo.sessions (
  token_hash CHAR(64)         NOT NULL CONSTRAINT pk_sessions PRIMARY KEY,
  user_id    UNIQUEIDENTIFIER NOT NULL
    CONSTRAINT fk_sessions_user REFERENCES dbo.users(id) ON DELETE CASCADE,
  expires_at DATETIME2(3)     NOT NULL,
  created_at DATETIME2(3)     NOT NULL CONSTRAINT df_sessions_created_at DEFAULT SYSUTCDATETIME()
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ix_sessions_user_id')
  CREATE INDEX ix_sessions_user_id ON dbo.sessions(user_id);

-- The tiles shown on the home page. icon is the key of a built-in icon (see src/lib/app-icons.ts,
-- e.g. N'quotation'); an unknown key shows a generic grid icon.
IF OBJECT_ID(N'dbo.apps', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.apps (
    id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT pk_apps PRIMARY KEY DEFAULT NEWID(),
    name        NVARCHAR(100)    NOT NULL
      CONSTRAINT ck_apps_name CHECK (LEN(name) BETWEEN 1 AND 100),
    description NVARCHAR(300)    NOT NULL CONSTRAINT df_apps_description DEFAULT N'',
    url         NVARCHAR(2000)   NOT NULL CONSTRAINT df_apps_url DEFAULT N'#',
    icon        NVARCHAR(50)     NOT NULL CONSTRAINT df_apps_icon DEFAULT N'',
    sort_order  INT              NOT NULL CONSTRAINT df_apps_sort_order DEFAULT 0,
    is_active   BIT              NOT NULL CONSTRAINT df_apps_is_active DEFAULT 1,
    created_at  DATETIME2(3)     NOT NULL CONSTRAINT df_apps_created_at DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(3)     NOT NULL CONSTRAINT df_apps_updated_at DEFAULT SYSUTCDATETIME()
  );
  -- The twelve tiles from the original site. Set each real web address in /admin.
  INSERT INTO dbo.apps (name, description, icon, sort_order) VALUES
    (N'Quotation Hub',          N'Create and track price quotations',     N'quotation', 1),
    (N'SIC Manager',            N'Manage industry classification codes',  N'sic',       2),
    (N'Client Hub',             N'Client contacts and relationships',     N'client',    3),
    (N'Password Pal',           N'Store and share credentials safely',    N'password',  4),
    (N'Expiry Notification',    N'Never miss a renewal date',             N'expiry',    5),
    (N'Store Manager',          N'Inventory and stock control',           N'store',     6),
    (N'Tasks App',              N'Plan, assign and track your to-dos',    N'tasks',     7),
    (N'Invoice Instructions',   N'Step-by-step invoicing guide',          N'invoice',   8),
    (N'HRM',                    N'HR Matters',                            N'hrm',       9),
    (N'WCR',                    N'Work Completion Records',               N'wcr',      10),
    (N'Purchase Instructions',  N'Step-by-step purchasing guide',         N'purchase', 11),
    (N'Payable Hub',            N'Track supplier bills and payments',     N'payable',  12);
END
