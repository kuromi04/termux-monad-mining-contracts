#!/data/data/com.termux/files/usr/bin/bash
# NATIVE Envio Runner for Termux (VA39 Patched)
# Matches 'ivam3' pattern: Native binary + Memory Patching

PROJECT_DIR="/data/data/com.termux/files/home/Projects/monad-mining-registry/packages/indexer"
NODE_GLIBC="$PROJECT_DIR/bin/node-glibc"
LOADER="/data/data/com.termux/files/usr/glibc/lib/ld-linux-aarch64.so.1"
LIB_PATH="/data/data/com.termux/files/usr/glibc/lib"

# Run node-glibc using the native glibc loader and patched binaries
# We use the full path to bin.mjs to avoid ESM resolution errors
"$LOADER" --library-path "$LIB_PATH" "$NODE_GLIBC" "$PROJECT_DIR/node_modules/envio/bin.mjs" "$@"
