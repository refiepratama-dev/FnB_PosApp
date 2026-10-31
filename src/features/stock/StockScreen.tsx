import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';

export default function StockScreen({ product, onClose, onSuccess }: { product: any, onClose: () => void, onSuccess: (newStock: number) => void }) {
  const [jumlahTambah, setJumlahTambah] = useState('');
  const [catatan, setCatatan] = useState('');

  const handleTambahStok = () => {
    if (!jumlahTambah || isNaN(Number(jumlahTambah))) {
      Alert.alert('Kesalahan', 'Masukkan jumlah stok yang valid.');
      return;
    }

    const tambahan = parseInt(jumlahTambah, 10);
    const stokBaru = (product?.stock || 0) + tambahan;

    Alert.alert('Sukses', `Berhasil menambahkan ${tambahan} stok!`);
    
    // Mengirim data stok baru kembali ke komponen induk
    onSuccess(stokBaru);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={true}>
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl">
          
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">{product?.name || 'Chicken Steak'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 font-bold text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center my-3">
            <View className="bg-red-50 w-16 h-16 rounded-2xl items-center justify-center mb-2">
              <Text className="text-red-500 font-bold text-xl">CS</Text>
            </View>
            <Text className="text-gray-500 text-xs">Stok sekarang</Text>
            <Text className="text-3xl font-extrabold text-gray-800">{product?.stock || 0}</Text>
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-1">Jumlah yang ditambahkan</Text>
          <TextInput
            placeholder="0"
            keyboardType="numeric"
            value={jumlahTambah}
            onChangeText={setJumlahTambah}
            className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-gray-800"
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</Text>
          <TextInput
            placeholder="Contoh: barang datang"
            value={catatan}
            onChangeText={setCatatan}
            className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 text-gray-800"
          />

          <TouchableOpacity 
            onPress={handleTambahStok}
            className="bg-blue-600 py-3.5 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-base">Simpan</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}