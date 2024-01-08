import { useMemo, useRef, useEffect, ReactNode, useCallback } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  ISocialLogin,
  ISocialLoginConfig,
  IWeb2LoginList,
  OnErrorFunc,
  RegisterType,
  SocialLoginFinishHandler,
  TotalAccountType,
} from '../../types';
import CustomSvg from '../CustomSvg';
import DividerCenter from '../DividerCenter';
import SocialContent from '../SocialContent';
import TermsOfServiceItem from '../TermsOfServiceItem';
import { CreateWalletType, LoginFinishWithoutPin, Theme } from '../types';
import useSocialLogin from '../../hooks/useSocialLogin';
import { errorTip, handleErrorMessage, setLoading } from '../../utils';
import './index.less';
import { TotalAccountsInfo } from '../../constants/socialLogin';
import { SocialLoginList, Web2LoginList } from '../../constants/guardian';

interface SocialLoginProps {
  type: RegisterType;
  theme?: Theme;
  isMobile?: boolean;
  className?: string;
  isShowScan?: boolean;
  socialLogin?: ISocialLoginConfig;
  termsOfService?: ReactNode;
  privacyPolicy?: string;
  extraElement?: ReactNode; // extra element
  networkType?: string;
  loginMethodsOrder?: TotalAccountType[];
  recommendIndexes?: number[];
  onBack?: () => void;
  onFinish?: SocialLoginFinishHandler;
  switchGuardianType?: (type: IWeb2LoginList) => void;
  switchType?: (type: CreateWalletType) => void;
  onLoginByPortkey?: LoginFinishWithoutPin;

  isErrorTip?: boolean;
  onError?: OnErrorFunc;
}

export default function SocialLogin({
  type,
  theme,
  className,
  isShowScan,
  socialLogin,
  isMobile = false,
  networkType,
  extraElement,
  termsOfService,
  privacyPolicy,
  isErrorTip,
  loginMethodsOrder,
  recommendIndexes,
  onBack,
  onFinish,
  onError,
  switchGuardianType,
  onLoginByPortkey,
  switchType,
}: SocialLoginProps) {
  const { t } = useTranslation();
  const onBackRef = useRef<SocialLoginProps['onBack']>(onBack);
  const onFinishRef = useRef<SocialLoginProps['onFinish']>(onFinish);

  const onErrorRef = useRef<SocialLoginProps['onError']>(onError);
  const switchGuardianTypeRef = useRef<SocialLoginProps['switchGuardianType']>(switchGuardianType);
  const switchTypeRef = useRef<SocialLoginProps['switchType']>(switchType);
  useEffect(() => {
    onBackRef.current = onBack;
    onFinishRef.current = onFinish;
    switchGuardianTypeRef.current = switchGuardianType;
    switchTypeRef.current = switchType;
    onErrorRef.current = onError;
  });
  const socialLoginHandler = useSocialLogin({ socialLogin, network: networkType });

  const isLogin = useMemo(() => type === 'Login', [type]);

  const onSocialChange = useCallback(
    async (type: ISocialLogin) => {
      try {
        setLoading(true);
        const result = await socialLoginHandler(type);
        setLoading(false);
        onFinishRef.current?.(result);
      } catch (error) {
        setLoading(false);
        errorTip(
          {
            errorFields: `socialLogin ${type}`,
            error: handleErrorMessage(error),
          },
          isErrorTip,
          onErrorRef.current,
        );
      }
    },
    [isErrorTip, socialLoginHandler],
  );

  const recommendList = useMemo(
    () => recommendIndexes?.map((item) => loginMethodsOrder?.[item]),
    [loginMethodsOrder, recommendIndexes],
  );
  const notRecommendList = useMemo(() => {
    return (loginMethodsOrder || Web2LoginList)?.filter((_item, index) => {
      return !recommendIndexes?.includes(index);
    });
  }, [loginMethodsOrder, recommendIndexes]);

  return (
    <>
      <div
        className={clsx(
          'portkey-ui-flex-column',
          'social-login-wrapper',
          isMobile && 'social-login-mobile-wrapper',
          className,
        )}>
        <h1 className="portkey-ui-flex-between-center font-medium social-login-title">
          {!isLogin && <CustomSvg type="BackLeft" onClick={onBackRef?.current} />}
          {isLogin && <span></span>}
          <div className={clsx('title')}>
            {isMobile ? (
              <>
                <CustomSvg type="Portkey" style={{ width: '56px', height: '56px' }} />
                {t(type)}
              </>
            ) : (
              t(type)
            )}
          </div>
          {isLogin && isShowScan && <CustomSvg type="QRCode" onClick={() => switchTypeRef?.current?.('LoginByScan')} />}
          {!isLogin && !isMobile && <span className="empty"></span>}
        </h1>
        <div className="portkey-ui-flex-column portkey-ui-flex-1 social-login-content">
          <SocialContent
            theme={theme}
            accountTypeList={recommendList as TotalAccountType[] | undefined}
            networkType={networkType}
            socialLogin={socialLogin}
            type={type}
            onSocialChange={onSocialChange}
            onLoginByPortkey={onLoginByPortkey}
          />
          <DividerCenter />

          <div className="portkey-ui-flex-center portkey-ui-extra-guardian-type-content">
            {notRecommendList?.map((item) => (
              <div
                className="icon-wrapper portkey-ui-flex-center"
                key={item}
                onClick={() => {
                  if (SocialLoginList.includes(item)) {
                    onSocialChange('Apple');
                    return;
                  }
                  switchGuardianTypeRef?.current?.(item as IWeb2LoginList);
                }}>
                <CustomSvg type={TotalAccountsInfo[item as IWeb2LoginList].icon as any} />
              </div>
            ))}
          </div>
          {extraElement}

          {isLogin && (
            <div className="go-sign-up">
              <span>{t('No account?')}</span>
              <span
                className="sign-text"
                onClick={() => {
                  switchTypeRef?.current?.('SignUp');
                }}>
                {t('Sign up')}
              </span>
            </div>
          )}
        </div>
      </div>

      <TermsOfServiceItem termsOfService={termsOfService} privacyPolicy={privacyPolicy} />
    </>
  );
}
