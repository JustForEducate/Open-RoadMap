import { BUILTIN_FOOTER, getAppFooterText } from '../config';
import { useI18n } from '../context/I18nContext';

function AppFooter() {
  const { t } = useI18n();
  const custom = getAppFooterText();
  const text = custom === BUILTIN_FOOTER ? t('footer.builtIn') : custom;
  return <footer className="footer">{text}</footer>;
}

export default AppFooter;
