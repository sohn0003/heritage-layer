
-- 1) Remove public SELECT on raw assets (assets_public view remains public)
DROP POLICY IF EXISTS "Anyone can view published assets" ON public.assets;

-- 2) Prevent users from escalating subscription_tier via profile UPDATE
CREATE OR REPLACE FUNCTION public.prevent_subscription_tier_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'subscription_tier can only be modified by admins or service role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_tier_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_tier_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_tier_self_update();
