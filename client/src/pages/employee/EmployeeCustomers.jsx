import React from 'react';
import { CustomerTable } from '../../components/customers/CustomerTable';

export const EmployeeCustomers = () => {
  return (
    <div className="space-y-6">
      <CustomerTable
        title="My Customers & Inquiries"
        subtitle="Manage and follow up on customer records created by you"
        showAddButton={true}
      />
    </div>
  );
};
