
DROP TRIGGER IF EXISTS prevent_subscription_tier_self_update_trg ON public.profiles;

CREATE TRIGGER prevent_subscription_tier_self_update_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_tier_self_update();
