-- Drop RLS policies for tables that are being rebuilt
DROP POLICY IF EXISTS "parent_request_school_isolation" ON "ParentRequest" CASCADE;
DROP POLICY IF EXISTS "parent_request_all" ON "ParentRequest" CASCADE;
DROP POLICY IF EXISTS "parent_request_system_admin" ON "ParentRequest" CASCADE;
DROP POLICY IF EXISTS "menu_school_isolation" ON "Menu" CASCADE;
DROP POLICY IF EXISTS "menu_all" ON "Menu" CASCADE;
DROP POLICY IF EXISTS "menu_system_admin" ON "Menu" CASCADE;
