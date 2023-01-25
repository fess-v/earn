import { useEffect } from 'react';
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Button, Container, Flex, Text, Group, MantineProvider } from '@mantine/core';
import { StackingClientProvider } from '@components/stacking-client-provider/stacking-client-provider';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { loadFonts } from '@utils/load-fonts';
import { ModalsProvider } from '@mantine/modals';
import { AuthProvider, useAuth } from './components/auth-provider/auth-provider';
import { SignIn } from './pages/sign-in/sign-in';
import { ChooseStackingMethod } from './pages/choose-stacking-method/choose-stacking-method';
import { StartPooledStacking } from './pages/stacking/start-pooled-stacking/start-pooled-stacking';
import { PooledStackingInfo } from './pages/stacking/pooled-stacking-info/pooled-stacking-info';
import { ErrorAlert } from '@components/error-alert';
import { toUnicode } from 'punycode';
import { Address } from '@components/address';
import { DirectStackingInfo } from './pages/stacking/direct-stacking-info/direct-stacking-info';
import { NetworkProvider, useNetwork } from '@components/network-provider';
import {
  BlockchainApiClientProvider,
  useBlockchainApiClient,
} from '@components/blockchain-api-client-provider';
import { StartDirectStacking } from './pages/stacking/start-direct-stacking/start-direct-stacking';

function Profile() {
  const { address } = useAuth();
  const { namesApi } = useBlockchainApiClient();
  const q = useQuery(['bns', address, namesApi], () => {
    return namesApi.getNamesOwnedByAddress({
      address: address ?? '',
      blockchain: 'stacks',
    });
  });

  if (!address) {
    const msg = 'Expected `address` to be defined.';
    console.error(msg);
    return <ErrorAlert id="71582283-38b4-497d-b7ce-b8d524699653">{msg}</ErrorAlert>;
  }

  const parseIfValidPunycode = (s: string) => {
    try {
      return toUnicode(s);
    } catch {
      return s;
    }
  };
  const bnsName = parseIfValidPunycode(q.data?.names[0] ?? '');
  return (
    <Group position="right">
      {bnsName && <Text>{bnsName}</Text>}
      <Address address={address} />
    </Group>
  );
}

function Layout() {
  const { isSignedIn, signOut } = useAuth();
  const { networkName, setNetworkByName } = useNetwork();

  return (
    <>
      <Flex h="100vh" direction="column">
        {isSignedIn && (
          <Group p="sm" position="right">
            <Profile />
            <Button
              variant="outline"
              onClick={() => {
                if (networkName === 'mainnet') {
                  setNetworkByName('testnet');
                  return;
                }

                setNetworkByName('mainnet');
              }}
            >
              {networkName !== 'mainnet' ? '🚧 ' : ''}
              {networkName}
            </Button>
            <Button onClick={() => signOut()}>Sign out</Button>
          </Group>
        )}
        <Container fluid>
          <Outlet />
        </Container>
      </Flex>
    </>
  );
}
const queryClient = new QueryClient();
function Root() {
  useEffect(() => void loadFonts(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <AuthProvider>
          <StackingClientProvider>
            <BlockchainApiClientProvider>
              <MantineProvider withGlobalStyles withNormalizeCSS theme={{ primaryColor: 'violet' }}>
                <ModalsProvider>
                  <Outlet />
                </ModalsProvider>
              </MantineProvider>
            </BlockchainApiClientProvider>
          </StackingClientProvider>
        </AuthProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}

function AuthGuard() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) {
    return <Navigate to="../sign-in" />;
  }

  return (
    <>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Navigate to="sign-in" /> },
      {
        path: 'sign-in',
        element: <SignIn />,
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <Layout />,
            children: [
              {
                path: 'choose-stacking-method',
                element: <ChooseStackingMethod />,
              },
              {
                path: 'start-pooled-stacking',
                element: <StartPooledStacking />,
              },
              {
                path: 'pooled-stacking-info',
                element: <PooledStackingInfo />,
              },

              {
                path: 'start-direct-stacking',
                element: <StartDirectStacking />,
              },
              {
                path: 'direct-stacking-info',
                element: <DirectStackingInfo />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
