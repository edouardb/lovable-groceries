
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { AuthForm } from '@/components/AuthForm';
import { GroceryListManager } from '@/components/GroceryListManager';
import { GroceryListDetail } from '@/components/GroceryListDetail';
import type { AuthResponse, GroceryList } from '../../server/src/schema';

type AuthUser = AuthResponse['user'];

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGroceryLists = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const lists = await trpc.getGroceryLists.query({ userId: user.id });
      setGroceryLists(lists);
    } catch (error) {
      console.error('Failed to load grocery lists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGroceryLists();
  }, [loadGroceryLists]);

  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedList(null);
    setGroceryLists([]);
  };

  const handleListCreated = (newList: GroceryList) => {
    setGroceryLists(prev => [...prev, newList]);
  };

  const handleListUpdated = (updatedList: GroceryList) => {
    setGroceryLists(prev => prev.map(list => 
      list.id === updatedList.id ? updatedList : list
    ));
    if (selectedList?.id === updatedList.id) {
      setSelectedList(updatedList);
    }
  };

  const handleListDeleted = (listId: number) => {
    setGroceryLists(prev => prev.filter(list => list.id !== listId));
    if (selectedList?.id === listId) {
      setSelectedList(null);
    }
  };

  const handleBackToLists = () => {
    setSelectedList(null);
    loadGroceryLists(); // Refresh lists when going back
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-600 mb-2">
              🛒 Lovable Groceries
            </h1>
            <p className="text-gray-600">Your smart shopping companion</p>
          </div>
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-orange-600">
                🛒 Lovable Groceries
              </h1>
              {selectedList && (
                <Button
                  variant="ghost"
                  onClick={handleBackToLists}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  ← Back to Lists
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.first_name}! 👋
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {selectedList ? (
          <GroceryListDetail
            list={selectedList}
            userId={user.id}
            onListUpdated={handleListUpdated}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Your Grocery Lists 📝
              </h2>
              <p className="text-gray-600">
                Organize your shopping with smart, categorized lists
              </p>
            </div>

            <GroceryListManager
              userId={user.id}
              groceryLists={groceryLists}
              isLoading={isLoading}
              onListCreated={handleListCreated}
              onListUpdated={handleListUpdated}
              onListDeleted={handleListDeleted}
              onListSelected={setSelectedList}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
