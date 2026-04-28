// Standard funding acknowledgment per PIC + ISED requirements.
// Update the consortium and program names by setting envs in .env.local:
//   NEXT_PUBLIC_CONSORTIUM=Atomic47 Labs Inc. × Crush Dynamics Inc.
//   NEXT_PUBLIC_PROGRAM=PCAIS

export default function FundingAcknowledgment() {
  const consortium = process.env.NEXT_PUBLIC_CONSORTIUM ?? 'the consortium';
  const program = process.env.NEXT_PUBLIC_PROGRAM ?? 'PCAIS';

  return (
    <footer style={{ color: '#666', fontSize: 12, lineHeight: 1.5 }}>
      <p>
        Funding acknowledgement: this project is supported by Protein Industries Canada
        through the {program} program (Global Innovation Cluster co-investment, Government
        of Canada through Innovation, Science and Economic Development Canada).
      </p>
      <p>{consortium}</p>
    </footer>
  );
}
