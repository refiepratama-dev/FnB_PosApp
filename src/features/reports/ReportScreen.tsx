import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
// Pastikan kamu menginstal library grafik: npm install react-native-chart-kit
import { BarChart } from 'react-native-chart-kit';

export default function ReportsScreen() {
  const [periode, setPeriode] = useState('Hari Ini');
  const tabs = ['Hari Ini', 'Tanggal', 'Minggu', 'Bulan'];
  const screenWidth = Dimensions.get('window').width - 32; // Margin kiri-kanan 16px

  // Data Dummy untuk KPI
  const kpiData = { omzet: 1250000, transaksi: 45, rataRata: 27777, laba: 850000 };

  // Data Dummy untuk Grafik Penjualan (Harian)
  const salesData = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [{ data: [1.2, 1.5, 1.1, 1.8, 2.5, 3.2, 2.8] }], // dalam Juta
  };

  // Data Dummy untuk Jam Ramai
  const peakHoursData = {
    labels: ['10', '12', '14', '16', '18', '20', '22'],
    datasets: [{ data: [5, 15, 8, 12, 25, 30, 10] }], // jumlah order
  };

  // Data Dummy untuk Menu Terlaris
  const topMenus = [
    { nama: 'Tenderloin Steak', terjual: 42, total: 100 },
    { nama: 'Sirloin Steak', terjual: 38, total: 100 },
    { nama: 'Chicken Steak', terjual: 25, total: 100 },
    { nama: 'Ice Lemon Tea', terjual: 60, total: 100 },
    { nama: 'French Fries', terjual: 30, total: 100 },
  ];

  // Data Dummy untuk Metode Pembayaran
  const paymentMethods = [
    { metode: 'QRIS', persen: 55, warna: 'bg-blue-500' },
    { metode: 'Tunai', persen: 30, warna: 'bg-green-500' },
    { metode: 'Transfer', persen: 15, warna: 'bg-orange-500' },
  ];

  const formatRupiah = (angka: number) => `Rp${angka.toLocaleString('id-ID')}`;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(26, 79, 232, ${opacity})`, // Warna Biru TemanPOS
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray-500
    barPercentage: 0.5,
    decimalPlaces: 1,
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* 1. Filter Periode */}
      <View className="flex-row bg-white rounded-full p-1 mb-6 shadow-sm">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setPeriode(tab)}
            className={`flex-1 py-2 rounded-full items-center ${
              periode === tab ? 'bg-blue-600' : 'bg-transparent'
            }`}
          >
            <Text className={`font-medium ${periode === tab ? 'text-white' : 'text-gray-500'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Kartu Angka (KPI) */}
      <Text className="text-lg font-bold text-gray-800 mb-3">Ringkasan {periode}</Text>
      <View className="flex-row flex-wrap justify-between mb-6">
        <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Omzet</Text>
          <Text className="text-xl font-bold text-blue-600">{formatRupiah(kpiData.omzet)}</Text>
        </View>
        <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Jml Transaksi</Text>
          <Text className="text-xl font-bold text-gray-800">{kpiData.transaksi}</Text>
        </View>
        <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Laba Sederhana</Text>
          <Text className="text-xl font-bold text-green-600">{formatRupiah(kpiData.laba)}</Text>
        </View>
        <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Rata-rata/Order</Text>
          <Text className="text-xl font-bold text-gray-800">{formatRupiah(kpiData.rataRata)}</Text>
        </View>
      </View>

      {/* 3. Grafik Penjualan */}
      <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
        <Text className="text-base font-bold text-gray-800 mb-4">Penjualan (Juta Rp)</Text>
        <BarChart
          data={salesData}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* 4. Grafik Jam Ramai */}
      <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
        <Text className="text-base font-bold text-gray-800 mb-4">Jam Ramai (Jml Order)</Text>
        <BarChart
          data={peakHoursData}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(238, 42, 36, ${opacity})` }} // Warna Merah TemanPOS
          verticalLabelRotation={0}
          fromZero
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* 5. Menu Terlaris (Ranking Bar) */}
      <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
        <Text className="text-base font-bold text-gray-800 mb-4">Menu Terlaris</Text>
        {topMenus.map((item, index) => (
          <View key={index} className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">{item.nama}</Text>
              <Text className="text-gray-500 font-medium">{item.terjual} porsi</Text>
            </View>
            <View className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <View
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${(item.terjual / item.total) * 100}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* 6. Metode Pembayaran (Persentase Bar) */}
      <View className="bg-white p-4 rounded-2xl mb-8 shadow-sm border border-gray-100">
        <Text className="text-base font-bold text-gray-800 mb-4">Metode Pembayaran</Text>
        {paymentMethods.map((metode, index) => (
          <View key={index} className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">{metode.metode}</Text>
              <Text className="text-gray-500 font-medium">{metode.persen}%</Text>
            </View>
            <View className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <View
                className={`${metode.warna} h-full rounded-full`}
                style={{ width: `${metode.persen}%` }}
              />
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}