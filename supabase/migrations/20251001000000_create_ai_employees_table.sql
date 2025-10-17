CREATE TABLE IF NOT EXISTS public.ai_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_request_id UUID NOT NULL REFERENCES public.ai_employee_deployment_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_employees_owner_all' AND tablename='ai_employees') THEN
    CREATE POLICY ai_employees_owner_all ON public.ai_employees
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_employees_admin_all' AND tablename='ai_employees') THEN
    CREATE POLICY ai_employees_admin_all ON public.ai_employees
      FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'));
  END IF;
END $$;

CREATE OR REPLACE TRIGGER trg_ai_employees_updated_at
  BEFORE UPDATE ON public.ai_employees
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();