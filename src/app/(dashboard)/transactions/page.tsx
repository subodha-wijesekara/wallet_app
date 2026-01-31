import { getAllTransactions } from "@/app/actions/transaction";

export const dynamic = "force-dynamic";

import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/edit-transaction-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { getUserSettings } from "@/app/actions/user";
import { formatCurrency } from "@/lib/utils";

export default async function TransactionsPage() {
    const transactions = await getAllTransactions();
    const settings = await getUserSettings();

    return (
        <div className="flex-1 space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                <div className="flex items-center space-x-2">
                    <AddTransactionDialog />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No transactions found.</p>
                        ) : (
                            transactions.map((t: any) => (
                                <div key={t._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {t.type === 'income' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none">
                                                {t.category}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {t.description || "No description"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(t.date), "PPP")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`font-medium ml-auto flex items-center gap-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        <span>
                                            {t.type === 'income' ? "+" : "-"}{formatCurrency(t.amount, settings.currency)}
                                        </span>
                                        <EditTransactionDialog transaction={t} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
