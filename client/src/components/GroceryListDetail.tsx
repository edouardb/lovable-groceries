
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { GroceryList, GroceryListWithItems, GroceryItem, CreateGroceryItemInput, Category } from '../../../server/src/schema';

interface GroceryListDetailProps {
  list: GroceryList;
  userId: number;
  onListUpdated: (list: GroceryList) => void;
}

export function GroceryListDetail({ list, userId }: GroceryListDetailProps) {
  const [listWithItems, setListWithItems] = useState<GroceryListWithItems | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [newItemData, setNewItemData] = useState<CreateGroceryItemInput>({
    grocery_list_id: list.id,
    name: '',
    quantity: null,
    notes: null,
    category_id: null,
    is_favorite: false
  });

  const loadListDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const [detailsResult, categoriesResult] = await Promise.all([
        trpc.getGroceryListWithItems.query({ listId: list.id, userId }),
        trpc.getCategories.query()
      ]);
      setListWithItems(detailsResult);
      setCategories(categoriesResult);
    } catch (error) {
      console.error('Failed to load list details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [list.id, userId]);

  useEffect(() => {
    loadListDetails();
  }, [loadListDetails]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingItem(true);

    try {
      const newItem = await trpc.createGroceryItem.mutate({
        ...newItemData,
        userId
      });
      
      if (listWithItems) {
        setListWithItems(prev => prev ? {
          ...prev,
          items: [...prev.items, newItem]
        } : null);
      }
      
      setNewItemData({
        grocery_list_id: list.id,
        name: '',
        quantity: null,
        notes: null,
        category_id: null,
        is_favorite: false
      });
      setShowAddItem(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleTogglePurchased = async (item: GroceryItem) => {
    try {
      const updatedItem = await trpc.updateGroceryItem.mutate({
        id: item.id,
        is_purchased: !item.is_purchased,
        userId
      });

      if (listWithItems) {
        setListWithItems(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === item.id ? updatedItem : i)
        } : null);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleToggleFavorite = async (item: GroceryItem) => {
    try {
      const updatedItem = await trpc.updateGroceryItem.mutate({
        id: item.id,
        is_favorite: !item.is_favorite,
        userId
      });

      if (listWithItems) {
        setListWithItems(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.id === item.id ? updatedItem : i)
        } : null);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await trpc.deleteGroceryItem.mutate({ itemId, userId });
      
      if (listWithItems) {
        setListWithItems(prev => prev ? {
          ...prev,
          items: prev.items.filter(i => i.id !== itemId)
        } : null);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return 'bg-gray-500';
    const category = categories.find(c => c.id === categoryId);
    return category ? `bg-${category.color}-500` : 'bg-gray-500';
  };

  const groupedItems = listWithItems?.items.reduce((groups, item) => {
    const categoryName = getCategoryName(item.category_id);
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {} as Record<string, GroceryItem[]>) || {};

  const purchasedCount = listWithItems?.items.filter(item => item.is_purchased).length || 0;
  const totalCount = listWithItems?.items.length || 0;
  const progress = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading list details...</p>
      </div>
    );
  }

  if (!listWithItems) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load list details. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List Header */}
      <Card className="border-orange-200 shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-orange-600 mb-2">
                🛒 {listWithItems.name}
              </CardTitle>
              {listWithItems.description && (
                <p className="text-gray-600">{listWithItems.description}</p>
              )}
            </div>
            <Badge
              variant={listWithItems.is_active ? 'default' : 'secondary'}
              className={listWithItems.is_active ? 'bg-green-500' : 'bg-gray-400'}
            >
              {listWithItems.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Progress: {purchasedCount} of {totalCount} items completed
            </div>
            <div className="text-sm font-semibold text-orange-600">
              {Math.round(progress)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Section */}
      <Card className="border-orange-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <span className="mr-2">➕</span>
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showAddItem ? (
            <Button
              onClick={() => setShowAddItem(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Add Item to List
            </Button>
          ) : (
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItemData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewItemData((prev: CreateGroceryItemInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Bananas, Milk, Bread"
                    className="border-orange-200 focus:border-orange-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    value={newItemData.quantity || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewItemData((prev: CreateGroceryItemInput) => ({
                        ...prev,
                        quantity: e.target.value || null
                      }))
                    }
                    placeholder="e.g., 2 lbs, 1 gallon, 6 pack"
                    className="border-orange-200 focus:border-orange-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={newItemData.category_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setNewItemData((prev: CreateGroceryItemInput) => ({
                      ...prev,
                      category_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-300">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 bg-${category.color}-500`}
                          ></div>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-notes">Notes</Label>
                <Textarea
                  id="item-notes"
                  value={newItemData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewItemData((prev: CreateGroceryItemInput) => ({
                      ...prev,
                      notes: e.target.value || null
                    }))
                  }
                  placeholder="Any special notes..."
                  className="border-orange-200 focus:border-orange-300"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="item-favorite"
                  checked={newItemData.is_favorite}
                  onCheckedChange={(checked: boolean) =>
                    setNewItemData((prev: CreateGroceryItemInput) => ({
                      ...prev,
                      is_favorite: checked
                    }))
                  }
                />
                <Label htmlFor="item-favorite">Mark as favorite ⭐</Label>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isAddingItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isAddingItem ? 'Adding...' : 'Add Item 🎉'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddItem(false)}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      {totalCount === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No items in this list yet
          </h3>
          <p className="text-gray-500">
            Add your first item to start building your shopping list!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([categoryName, items]) => (
            <Card key={categoryName} className="border-orange-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-700 flex items-center">
                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${getCategoryColor(items[0]?.category_id)}`}
                  ></div>
                  {categoryName}
                  <Badge variant="secondary" className="ml-2">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {items.map((item: GroceryItem) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        item.is_purchased
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={item.is_purchased}
                          onCheckedChange={() => handleTogglePurchased(item)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${
                                item.is_purchased
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-800'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.is_favorite && (
                              <span className="text-yellow-500">⭐</span>
                            )}
                          </div>
                          {item.quantity && (
                            <div className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-sm text-gray-600">
                              Notes: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleToggleFavorite(item)}
                          size="sm"
                          variant="ghost"
                          className="text-yellow-600 hover:bg-yellow-50"
                        >
                          {item.is_favorite ? '⭐' : '☆'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                            >
                              🗑️
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteItem(item.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
