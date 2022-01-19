import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { CandyMachineAccount } from './candy-machine';
import { CircularProgress } from '@material-ui/core';
import { GatewayStatus, useGateway } from '@civic/solana-gateway-react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const CTAButton = styled(Button)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`; // add your own styles here

export const MintButton = ({
  onMint,
  candyMachine,
  isMinting,
}: {
  onMint: () => Promise<void>;
  candyMachine?: CandyMachineAccount;
  isMinting: boolean;
}) => {
  const { requestGatewayToken, gatewayStatus } = useGateway();
  const [clicked, setClicked] = useState(false);
  const [showEncore, setShowEncore] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    if (gatewayStatus === GatewayStatus.ACTIVE && clicked) {
      onMint();
      setClicked(false);
    }
  }, [gatewayStatus, clicked, setClicked, onMint]);

  useEffect(() => {
    if (showEncore) {
      const fc = async (event: { data: string }) => {
        if (event.data === 'QUIZ_FINISHED') {
          setShowEncore(false);
          await requestGatewayToken();
        }
      };

      window.addEventListener('message', fc);

      return () => {
        window.removeEventListener('message', fc);
      };
    }
  }, [showEncore]);

  const getMintButtonContent = () => {
    if (candyMachine?.state.isSoldOut) {
      return 'SOLD OUT';
    } else if (isMinting) {
      return <CircularProgress />;
    } else if (candyMachine?.state.isPresale) {
      return 'PRESALE MINT';
    }

    return 'MINT';
  };

  return (
    <>
      {showEncore && (
        <iframe
          src={`http://www.encore.fans/embed?wallet=${wallet.publicKey?.toBase58()}&target=${
            window.location.href
          }`}
          width="360"
          height="540"
        ></iframe>
      )}
      <CTAButton
        disabled={
          candyMachine?.state.isSoldOut ||
          isMinting ||
          !candyMachine?.state.isActive
        }
        onClick={async () => {
          setClicked(true);
          if (candyMachine?.state.isActive && candyMachine?.state.gatekeeper) {
            if (gatewayStatus === GatewayStatus.ACTIVE) {
              setClicked(true);
            } else {
              if (
                candyMachine.state.gatekeeper.gatekeeperNetwork.toBase58() ==
                'ign2PJfwxvYxAZpMdXgLdY4VLCnChPZWjtTeQwQfQdc'
              )
                setShowEncore(true);
              else await requestGatewayToken();
            }
          } else {
            await onMint();
            setClicked(false);
          }
        }}
        variant="contained"
      >
        {getMintButtonContent()}
      </CTAButton>
    </>
  );
};
