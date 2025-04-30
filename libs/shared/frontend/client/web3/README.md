# Web3 Client Library

A library for Web3 integration in the SinglePageStartup (SPS) project. Provides tools and components for interacting with Ethereum Virtual Machine (EVM) compatible blockchains.

## Structure

```
src/
└── lib/
    └── ethereum-virtual-machine/    # EVM integration
        ├── wagmi-config/           # Wagmi configuration
        │   └── default/            # Default configuration
        ├── provider/               # Web3 provider
        └── connect-wallet-button/  # Wallet connection component
```

## Components

### Ethereum Virtual Machine (EVM)

- Integration with EVM-compatible blockchains
- Smart contract interaction
- Transaction handling
- Event listening

### Wagmi Configuration

- Default configuration for Wagmi
- Chain configuration
- Provider setup
- Contract configuration

### Web3 Provider

- Provider initialization
- Network management
- Account management
- Transaction signing

### Connect Wallet Button

- Wallet connection UI
- Account selection
- Network switching
- Error handling

## Usage

```typescript
import {
  EvmProvider,
  ConnectWalletButton,
  wagmiConfig
} from "@sps/shared/frontend/client/web3";

// Provider setup
const provider = new EvmProvider({
  chains: wagmiConfig.chains,
  autoConnect: true
});

// Wallet connection
<ConnectWalletButton
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
  onError={handleError}
/>
```

## Features

1. **Blockchain Integration**:

   - EVM-compatible chains support
   - Smart contract interaction
   - Transaction management
   - Event handling

2. **Wallet Management**:

   - Multiple wallet support
   - Account management
   - Network switching
   - Transaction signing

3. **Configuration**:
   - Default Wagmi setup
   - Chain configuration
   - Provider settings
   - Contract settings

## Best Practices

1. **Security**:

   - Proper error handling
   - Transaction validation
   - Network verification
   - Account verification

2. **User Experience**:

   - Clear error messages
   - Loading states
   - Transaction feedback
   - Network status

3. **Performance**:
   - Provider optimization
   - Event listener management
   - Cache utilization
   - Batch requests

## License

MIT
