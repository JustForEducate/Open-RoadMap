import { getAppFooterText } from '../config/app.js';

export default function AppFooter() {
  return <footer className="footer">{getAppFooterText()}</footer>;
}
