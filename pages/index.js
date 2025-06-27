
import dynamic from 'next/dynamic';

const SmartClaimsAnalyzer = dynamic(() => import('../components/SmartClaimsAnalyzer'), {
  ssr: false
});

export default function Home() {
  return <SmartClaimsAnalyzer />;
}
