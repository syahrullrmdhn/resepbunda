const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ambil konfigurasi default untuk resolver
const { resolver } = config;

// Tambahkan 'wasm' ke daftar ekstensi aset (biar bisa di-load sebagai file)
config.resolver.assetExts.push('wasm');

// Pastikan 'wasm' TIDAK ada di sourceExts (biar tidak dibaca sebagai kodingan JS)
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'wasm');

module.exports = config;