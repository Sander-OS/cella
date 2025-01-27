import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { checkTokenSchema } from 'backend/modules/general/schema';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import type { ApiError } from '~/api';
import { acceptInvite as baseAcceptInvite } from '~/api/general';
import { checkToken as baseCheckToken } from '~/api/general';
import { useMutation } from '~/hooks/use-mutations';
import { cn } from '~/lib/utils';
import AuthPage from '../auth/auth-page';
import { Button, buttonVariants } from '../ui/button';

type TokenData = z.infer<typeof checkTokenSchema>;

const AcceptInvite = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token }: { token: string } = useParams({ strict: false });

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const { mutate: checkToken, isPending: isChecking } = useMutation({
    mutationFn: baseCheckToken,
    onSuccess: (data) => setTokenData(data),
    onError: (error) => setError(error),
  });

  const { mutate: acceptInvite, isPending } = useMutation({
    mutationFn: baseAcceptInvite,
    onSuccess: () => {
      toast.success(t('common:invitation_accepted'));
      navigate({
        to: tokenData?.organizationSlug ? `/${tokenData.organizationSlug}` : '/home',
      });
    },
    onError: (error) => {
      setError(error);
    },
  });

  const onSubmit = () => {
    acceptInvite({
      token,
    });
  };

  useEffect(() => {
    if (!token) return;
    checkToken(token);
  }, [token]);

  if (isChecking) return <Loader2 className="text-muted-foreground mx-auto mt-[40vh] h-10 w-10 animate-spin" />;

  return (
    <AuthPage>
      <h1 className="text-2xl text-center">{t('common:accept_invite')}</h1>

      <p className="font-light mb-4">{t('common:accept_invite_text', { email: tokenData?.email, organization: tokenData?.organizationName })}</p>

      {tokenData?.email && !error ? (
        <div className="space-y-4">
          <Button type="submit" loading={isPending} className="w-full" onClick={onSubmit}>
            {t('common:accept')}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      ) : (
        <div className="max-w-[32rem] m-4 flex flex-col items-center text-center">
          {/* TODO: we need a render error message component ? */}
          {error && (
            <>
              <span className="text-muted-foreground text-sm">{t(`common:error.${error.type}`)}</span>
              <Link to="/auth/sign-in" className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
                {t('common:sign_in')}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </>
          )}
          {isPending && <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />}
        </div>
      )}
    </AuthPage>
  );
};

export default AcceptInvite;
