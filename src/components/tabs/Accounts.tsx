import React from "react";
import { Wallet, Edit2, PlusCircle } from "lucide-react";
import { formatCurrency } from "../../utils";
import type { Account } from "../../types";

interface AccountsProps {
  accounts: Account[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  handleEditAccount: (acc: Account, e: React.MouseEvent) => void;
  handleAddAccount: () => void;
}

const Accounts: React.FC<AccountsProps> = ({
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  handleEditAccount,
  handleAddAccount,
}) => {
  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
          这里管理你的所有证券账户。不同的账户交易将被分开记录，但在首页可以查看汇总资产。
        </div>
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex justify-between items-center p-4 bg-white border shadow-sm rounded-lg hover:border-blue-300 transition cursor-pointer"
              onClick={() => setSelectedAccountId(acc.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <Wallet size={18} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">{acc.name}</div>
                  <div className="text-xs text-gray-400">
                    期初盈亏:{" "}
                    <span
                      className={
                        acc.initialRealizedPnL && acc.initialRealizedPnL >= 0
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {formatCurrency(acc.initialRealizedPnL || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedAccountId === acc.id && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    当前选中
                  </span>
                )}
                <button
                  onClick={(e) => handleEditAccount(acc, e)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                  title="编辑账户"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleAddAccount}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition font-medium flex justify-center items-center space-x-2"
        >
          <PlusCircle size={18} />
          <span>添加新的证券账户</span>
        </button>
      </div>
    </div>
  );
};

export default Accounts;
