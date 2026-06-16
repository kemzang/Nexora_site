// Client Supabase unique. Ce fichier créait AVANT un second client sans config
// (storageKey par défaut) : la session posée au login via '@/lib/supabase/client'
// (storageKey 'nxr-session') y était donc invisible → getUser() renvoyait null →
// boucle de login infinie (ex. sur auth/continue-redirect). On réexporte
// désormais le client configuré unique pour que TOUT le code partage la même
// session.
export { supabase } from "./supabase/client";
