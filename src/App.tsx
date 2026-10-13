/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/Header';
import { WaiterOrderScreen } from './components/WaiterOrderScreen';
import { KitchenDisplayScreen } from './components/KitchenDisplayScreen';
import { TablesScreen } from './components/TablesScreen';
import { MenuManagerScreen } from './components/MenuManagerScreen';
import { WaiterProfileScreen } from './components/WaiterProfileScreen';
import { SalesDashboardScreen } from './components/SalesDashboardScreen';
import { NotificationToast } from './components/NotificationToast';

const MainContent: React.FC = () => {
  const { activeScreen } = useRestaurant();

  return (
    <main className="pb-16 sm:pb-8">
      {activeScreen === 'waiter' && <WaiterOrderScreen />}
      {activeScreen === 'kitchen' && <KitchenDisplayScreen />}
      {activeScreen === 'tables' && <TablesScreen />}
      {activeScreen === 'sales' && <SalesDashboardScreen />}
      {activeScreen === 'menu' && <MenuManagerScreen />}
      {activeScreen === 'profile' && <WaiterProfileScreen />}
    </main>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
        <Header />
        <div className="flex-1">
          <MainContent />
        </div>
        <NotificationToast />
      </div>
    </RestaurantProvider>
  );
}
