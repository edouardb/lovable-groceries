
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { GroceryList, CreateGroceryListInput } from '../../../server/src/schema';

interface GroceryListManagerProps {
  userId: number;
  groceryLists: GroceryList[];
  isLoading: boolean;
  onListCreated: (list: GroceryList) => void;
  onListUpdated: (list: GroceryList) => void;
  onListDeleted: (listId: number) => void;
  onListSelected: (list: GroceryList) => void;
}

export function GroceryListManager({
  userId,
  groceryLists,
  isLoading,
  onListCreated,
  onListUpdated,
  onListDeleted,
  onListSelected
}: GroceryListManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateGroceryListInput>({
    user_id: userId,
    name: '',
    description: null
  });

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newList = await trpc.createGroceryList.mutate(formData);
      onListCreated(newList);
      setFormData({ user_id: userId, name: '', description: null });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    try {
      await trpc.deleteGroceryList.mutate({ listId, userId });
      onListDeleted(listId);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleToggleActive = async (list: GroceryList) => {
    try {
      const updatedList = await trpc.updateGroceryList.mutate({
        id: list.id,
        is_active: !list.is_active,
        userId
      });
      onListUpdated(updatedList);
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New List Section */}
      <Card className="border-orange-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <span className="mr-2">✨</span>
            Create New List
          </CardTitle>
          <CardDescription>
            Start a new grocery list for your shopping adventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Create New Grocery List
            </Button>
          ) : (
            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateGroceryListInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Weekly Shopping, Party Supplies"
                  className="border-orange-200 focus:border-orange-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-description">Description (Optional)</Label>
                <Textarea
                  id="list-description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateGroceryListInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Add notes about this list..."
                  className="border-orange-200 focus:border-orange-300"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isCreating ? 'Creating...' : 'Create List 🎉'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Lists Display */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading your lists...</p>
        </div>
      ) : groceryLists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No grocery lists yet
          </h3>
          <p className="text-gray-500">
            Create your first list to start organizing your shopping!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groceryLists.map((list: GroceryList) => (
            <Card
              key={list.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                list.is_active
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-gray-800 line-clamp-1">
                    {list.name}
                  </CardTitle>
                  <Badge
                    variant={list.is_active ? 'default' : 'secondary'}
                    className={list.is_active ? 'bg-green-500' : 'bg-gray-400'}
                  >
                    {list.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {list.description && (
                  <CardDescription className="line-clamp-2">
                    {list.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 mb-4">
                  Created: {list.created_at.toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onListSelected(list)}
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    View Items
                  </Button>
                  <Button
                    onClick={() => handleToggleActive(list)}
                    size="sm"
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {list.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete List</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{list.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteList(list.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
