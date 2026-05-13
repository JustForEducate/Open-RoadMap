import { getAppFooterText } from '../config';

function AppFooter() {
  return <footer className="footer">{getAppFooterText()}</footer>;
}

export default AppFooter;
