import { Link } from 'react-router-dom';
import { contentApi } from '../api/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader } from '../components/Ui.jsx';
import { Icon } from '../components/Icons.jsx';

export function About() {
  const { data: s } = useFetch(() => contentApi.settings(), []);
  const stats = s ? [['experience', 'Years of experience'], ['project', 'Properties listed'], ['clients', 'Happy clients'], ['award', 'Awards']].filter(([k]) => s[k]) : [];
  const steps = [
    ['Search', 'Filter by city, area, price and rooms to see only homes that fit.'],
    ['Connect', 'Send an “I’m interested” request and our team gets back to you.'],
    ['Move in', 'Visit, agree the terms and move into your new place with confidence.'],
  ];

  return (
    <>
      <PageHeader title="About us" subtitle="Making renting simple, transparent and stress-free" />
      <div className="container narrow section">
        <p className="lead">
          {s?.company_name || 'Smart Tolet'} is an online house rental platform. Landlords list their properties, our team reviews each
          listing, and renters browse verified homes, save favourites and get in touch, all in one place.
        </p>

        {stats.length > 0 && (
          <div className="stats flat">
            {stats.map(([k, label]) => (<div key={k}><strong>{s[k]}</strong><span>{label}</span></div>))}
          </div>
        )}

        <h2 className="mt">How it works</h2>
        <div className="grid grid-3">
          {steps.map(([t, d], i) => (
            <div key={t} className="card step">
              <span className="step-n">{i + 1}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>

        <h2 className="mt">Why people choose us</h2>
        <ul className="ticks">
          <li><Icon.Check /> Every listing is checked by our team before it goes live</li>
          <li><Icon.Check /> Save properties and compare them any time</li>
          <li><Icon.Check /> Pay by card, bank account or mobile banking, confirmed by reference</li>
          <li><Icon.Check /> Available in English and Bangla</li>
        </ul>

        <div className="link-row">
          <Link to="/properties" className="btn btn-primary">Browse properties</Link>
          <Link to="/contact" className="btn btn-outline">Contact us</Link>
        </div>
      </div>
    </>
  );
}

const FAQS = [
  ['How do I find a property?', 'Use the search on the home page or the Properties page. You can filter by city, area, price, bedrooms and more.'],
  ['Do I need an account to browse?', 'No. Browsing and searching are free without an account. You need one to save properties or post your own.'],
  ['How do I list my property?', 'Create an account, open “Post a property”, fill in the details and add photos. Our team reviews it before it is published.'],
  ['Why is my property still “Pending review”?', 'New listings are checked by our team first. Once approved it appears on the site and its status changes to “Published”.'],
  ['What does the listing fee cover?', 'Send the fee to one of our card, bank or mobile banking accounts, then submit the transaction reference from the “My properties” page. Once we verify it, your listing can be published. You can apply a coupon code when you submit.'],
  ['My payment failed but money was deducted. What now?', 'The payment gateway confirms the transaction with us automatically. If your status is not updated within a day, contact us with your transaction reference.'],
  ['How do I contact the owner?', 'On the property page, send an “I’m interested” request and our team will connect you.'],
];

export function Faq() {
  return (
    <>
      <PageHeader title="Frequently asked questions" subtitle="Quick answers to common questions" />
      <div className="container narrow section">
        <div className="faq">
          {FAQS.map(([q, a]) => (
            <details key={q} className="card">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="muted center-text">Still need help? <Link to="/contact" className="link">Contact us</Link></p>
      </div>
    </>
  );
}

export function Privacy() {
  return (
    <>
      <PageHeader title="Privacy policy" subtitle="How we handle your personal information" />
      <div className="container narrow section legal">
        <p>This policy explains how we process the personal information you give us. We will tell you if the way we process it changes.</p>
        <h3>Information we collect</h3>
        <p>Your name, email, phone number and the details you submit when registering, listing a property, contacting us or sending an enquiry. You can browse the site without giving us personal data, apart from information collected by cookies.</p>
        <h3>How we use it</h3>
        <p>To run your account, review and publish your listings, process payments, respond to enquiries and, where you have agreed, send you offers and news. You can ask us to stop at any time by contacting us with “unsubscribe” as the subject.</p>
        <h3>Sharing</h3>
        <p>We do not sell your data. We share it only with service providers that help us run the site (for example, our payment gateway) or when the law requires it.</p>
        <h3>Cookies</h3>
        <p>We use cookies and similar storage to keep you signed in, remember your language and understand how the site is used. You can block cookies in your browser, but some features may stop working.</p>
        <h3>Security</h3>
        <p>We use technical and organisational measures to protect your data against unauthorised access, loss or misuse. No online service can be guaranteed 100% secure.</p>
        <h3>Your choices</h3>
        <p>You may ask what personal information we hold about you, ask us to correct it, or ask us to delete your account, by contacting us through the <Link to="/contact" className="link">contact page</Link>.</p>
        <h3>Disclaimer</h3>
        <p>We do not warrant that listing information is accurate, complete or current, and we are not responsible for the content of external sites we link to. Please verify details before you commit to any agreement.</p>
      </div>
    </>
  );
}

export function Terms() {
  return (
    <>
      <PageHeader title="Terms of use" subtitle="Please read these terms before using the site" />
      <div className="container narrow section legal">
        <p>By using this website you agree to the terms below. If you do not agree, please do not use the site.</p>
        <h3>1. Accounts</h3>
        <p>You must give true, accurate and current registration details, keep them up to date and be at least eighteen years old and legally able to enter into contracts. You are responsible for activity under your account.</p>
        <h3>2. Content you post</h3>
        <p>You are responsible for the property details and photos you submit. They must be accurate and must not be illegal, misleading, offensive or infringe anyone’s rights. We may review, refuse or remove any listing without notice.</p>
        <h3>3. Listings and payments</h3>
        <p>Listings are published after review. Fees, where they apply, are paid online through our payment gateway. We are a property portal and are not a party to any rental agreement between landlords and tenants.</p>
        <h3>4. Acceptable use</h3>
        <p>Do not misuse the site, attempt to break its security, scrape it at scale or use it to send spam.</p>
        <h3>5. Intellectual property</h3>
        <p>The site design, text and graphics belong to us or our licensors. You may not copy or reuse them without permission.</p>
        <h3>6. Liability</h3>
        <p>The site is provided “as is”. To the extent the law allows, we are not liable for losses arising from your use of the site or from reliance on information published by users.</p>
        <h3>7. Changes</h3>
        <p>We may update these terms from time to time. Continued use of the site means you accept the updated terms.</p>
        <p className="muted">Questions? <Link to="/contact" className="link">Contact us</Link>.</p>
      </div>
    </>
  );
}
