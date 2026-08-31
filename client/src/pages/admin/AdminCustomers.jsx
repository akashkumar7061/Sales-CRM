import React, { useState } from 'react';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { ImportModal } from '../../components/import/ImportModal';

export const AdminCustomers = () => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <CustomerTable
        key={refreshKey}
        title="All Company Customers"
        subtitle="Full master database of sales leads across all sales reps"
        showAddButton={true}
        onOpenImportModal={() => setIsImportOpen(true)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
