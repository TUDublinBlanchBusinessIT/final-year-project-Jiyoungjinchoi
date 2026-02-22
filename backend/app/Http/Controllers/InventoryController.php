<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $items = InventoryItem::where('user_id', $user->id)
            ->where('is_active', true)
            ->latest()
            ->get()
            ->map(function ($item) {
                $dailyUsage = (float) $item->daily_usage;
                $currentQty = (float) $item->current_quantity;

                $daysLeft = null;
                $depletionDate = null;

                if ($dailyUsage > 0) {
                    $daysLeft = (int) floor($currentQty / $dailyUsage);
                    $depletionDate = now()->addDays(max(0, $daysLeft))->toDateString();
                }

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category,
                    'unit' => $item->unit,
                    'current_quantity' => $currentQty,
                    'daily_usage' => $dailyUsage,
                    'remind_before_days' => (int) $item->remind_before_days,
                    'last_restocked_at' => optional($item->last_restocked_at)->toDateTimeString(),
                    'days_left' => $daysLeft,
                    'estimated_depletion_date' => $depletionDate,
                ];
            });

        return response()->json($items, 200);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:40'],
            'unit' => ['nullable', 'string', 'max:20'],
            'current_quantity' => ['required', 'numeric', 'min:0'],
            'daily_usage' => ['required', 'numeric', 'min:0'],
            'remind_before_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $item = InventoryItem::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'category' => $validated['category'] ?? 'Food',
            'unit' => $validated['unit'] ?? 'g',
            'current_quantity' => $validated['current_quantity'],
            'daily_usage' => $validated['daily_usage'],
            'remind_before_days' => $validated['remind_before_days'] ?? 7,
            'last_restocked_at' => now(),
            'is_active' => true,
        ]);

        return response()->json(['item' => $item], 201);
    }

    // ✅ NEW: Update (Edit)
    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $user = $request->user();

        if ($inventoryItem->user_id !== $user->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:40'],
            'unit' => ['nullable', 'string', 'max:20'],
            'current_quantity' => ['required', 'numeric', 'min:0'],
            'daily_usage' => ['required', 'numeric', 'min:0'],
            'remind_before_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $inventoryItem->name = $validated['name'];
        $inventoryItem->category = $validated['category'] ?? $inventoryItem->category;
        $inventoryItem->unit = $validated['unit'] ?? $inventoryItem->unit;
        $inventoryItem->current_quantity = $validated['current_quantity'];
        $inventoryItem->daily_usage = $validated['daily_usage'];
        $inventoryItem->remind_before_days = $validated['remind_before_days'] ?? $inventoryItem->remind_before_days;

        $inventoryItem->save();

        return response()->json([
            'message' => 'Item updated successfully.',
            'item' => $inventoryItem,
        ], 200);
    }

    public function restock(Request $request, InventoryItem $inventoryItem)
    {
        $user = $request->user();

        if ($inventoryItem->user_id !== $user->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'quantity_added' => ['required', 'numeric', 'min:0.01'],
        ]);

        $inventoryItem->current_quantity =
            (float) $inventoryItem->current_quantity + (float) $validated['quantity_added'];

        $inventoryItem->last_restocked_at = now();
        $inventoryItem->save();

        return response()->json([
            'message' => 'Restocked successfully.',
            'item' => $inventoryItem,
        ], 200);
    }

    public function destroy(Request $request, InventoryItem $inventoryItem)
    {
        $user = $request->user();

        if ($inventoryItem->user_id !== $user->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $inventoryItem->is_active = false;
        $inventoryItem->save();

        return response()->json(['message' => 'Item deleted.'], 200);
    }
}