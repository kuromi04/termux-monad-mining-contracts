#!/data/data/com.termux/files/usr/bin/bash
# Wrapper for Envio on Termux via proot-distro Debian
# Matches the 'antigravity' pattern of running standard Linux binaries

PROJECT_DIR="/data/data/com.termux/files/home/Projects/monad-mining-registry/packages/indexer"

proot-distro login debian -- sh -c "cd $PROJECT_DIR && /usr/bin/envio $@"
