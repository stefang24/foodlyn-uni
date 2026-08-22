import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NotifyService } from '../../../../shared/services/notify.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, firstValueFrom } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Restaurant } from '../../../../shared/services/restaurant.service';
import { Menu as MenuService } from '../../../../shared/services/menu.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { RestaurantDTO } from '../../../../shared/models/restaurantDTO.model';
import { Result } from '../../../../shared/models/result.model';
import {
    CreateMenuCategoryDTO,
    CreateMenuDTO,
    CreateMenuItemDTO,
    CreateMenuItemModifierDTO,
    CreateMenuItemModifierGroupDTO,
    MenuCategoryDTO,
    MenuDTO,
    MenuItemDTO,
    MenuItemModifierDTO,
    MenuItemModifierGroupDTO,
    UpdateMenuCategoryDTO,
    UpdateMenuDTO,
    UpdateMenuItemDTO,
    UpdateMenuItemModifierDTO,
    UpdateMenuItemModifierGroupDTO,
} from '../../../../shared/models/menuDTO.model';
import { MenuItemCard } from '../../../../shared/components/menu-item-card/menu-item-card';
import { ImageUpload } from '../../../../shared/components/image-upload/image-upload';

const SAVE_MENU_KEY = 'saveMenu';
const SAVE_CATEGORY_KEY = 'saveCategory';
const SAVE_ITEM_KEY = 'saveItem';

@Component({
    selector: 'app-menu-management-page',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToggleSwitchModule,
        ConfirmDialogModule,
        MenuItemCard,
        CurrencyPipe,
        ImageUpload,
    ],
    templateUrl: './menu-management-page.html',
    styleUrl: './menu-management-page.scss',
    providers: [ConfirmationService],
})
export class MenuManagementPage implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly restaurantService: Restaurant = inject(Restaurant);
    private readonly menuService: MenuService = inject(MenuService);
    private readonly messageService = inject(NotifyService);
    private readonly confirmationService = inject(ConfirmationService);
    protected readonly loadingService: LoadingService = inject(LoadingService);

    protected readonly SAVE_MENU_KEY = SAVE_MENU_KEY;
    protected readonly SAVE_CATEGORY_KEY = SAVE_CATEGORY_KEY;
    protected readonly SAVE_ITEM_KEY = SAVE_ITEM_KEY;

    protected readonly restaurants = signal<RestaurantDTO[]>([]);
    protected readonly restaurantOptions = computed(() =>
        this.restaurants().map((r) => ({ label: r.name, value: r.id })),
    );
    protected readonly selectedRestaurantId = signal<number | null>(null);
    protected readonly selectedRestaurant = computed(() =>
        this.restaurants().find((r) => r.id === this.selectedRestaurantId()) ?? null,
    );
    protected readonly restaurantCurrency = computed(() => this.selectedRestaurant()?.currency ?? null);

    protected readonly menus = signal<MenuDTO[]>([]);
    protected readonly selectedMenuId = signal<number | null>(null);
    protected readonly selectedMenu = computed(() =>
        this.menus().find((m) => m.id === this.selectedMenuId()) ?? null,
    );

    protected readonly loadingMenus = signal(false);

    protected readonly menuDialog = signal(false);
    protected readonly categoryDialog = signal(false);
    protected readonly itemDialog = signal(false);

    protected editingMenu: MenuDTO | null = null;
    protected editingCategory: MenuCategoryDTO | null = null;
    protected editingItem: MenuItemDTO | null = null;
    protected itemParentCategoryId: number | null = null;

    protected readonly editingItemGroups = signal<MenuItemModifierGroupDTO[]>([]);
    protected readonly newGroupName = signal('');
    protected readonly newGroupMin = signal(0);
    protected readonly newGroupMax = signal(1);
    protected readonly editingGroupId = signal<number | null>(null);
    protected readonly editingGroupName = signal('');
    protected readonly editingGroupMin = signal(0);
    protected readonly editingGroupMax = signal(1);

    protected readonly newModifierName = signal<Record<number, string>>({});
    protected readonly newModifierPrice = signal<Record<number, number>>({});
    protected readonly editingModifierId = signal<number | null>(null);
    protected readonly editingModifierName = signal('');
    protected readonly editingModifierPrice = signal(0);

    protected readonly spicinessOptions = [
        { label: 'Not spicy', value: 0 },
        { label: 'Mild', value: 1 },
        { label: 'Medium', value: 2 },
        { label: 'Hot', value: 3 },
    ];

    menuForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: ['', [Validators.maxLength(1000)]],
        imageUrl: ['', [Validators.maxLength(500)]],
        bannerImageUrl: ['', [Validators.maxLength(500)]],
        sortOrder: [0],
        isActive: [true],
        isPublished: [true],
        startDate: [null as Date | null],
        endDate: [null as Date | null],
    });

    categoryForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: ['', [Validators.maxLength(1000)]],
        imageUrl: ['', [Validators.maxLength(500)]],
        icon: ['', [Validators.maxLength(100)]],
        sortOrder: [0],
        isActive: [true],
    });

    itemForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        shortDescription: ['', [Validators.maxLength(300)]],
        description: ['', [Validators.maxLength(2000)]],
        imageUrl: ['', [Validators.maxLength(500)]],
        thumbnailUrl: ['', [Validators.maxLength(500)]],
        price: [0, [Validators.required, Validators.min(0)]],
        discountedPrice: [null as number | null],
        calories: [null as number | null],
        preparationTimeMinutes: [null as number | null],
        servingSizeGrams: [null as number | null],
        spicinessLevel: [0],
        isVegetarian: [false],
        isVegan: [false],
        isGlutenFree: [false],
        isDairyFree: [false],
        isHalal: [false],
        isKosher: [false],
        isFeatured: [false],
        isNew: [false],
        isAvailable: [true],
        isActive: [true],
        stockQuantity: [null as number | null],
        sortOrder: [0],
        allergensCsv: [''],
        tagsCsv: [''],
        ingredientsCsv: [''],
    });

    ngOnInit(): void {
        this.loadRestaurants();
    }

    private loadRestaurants(): void {
        this.restaurantService.getMine().subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.restaurants.set(res.value);
                    if (res.value.length > 0 && this.selectedRestaurantId() === null) {
                        this.selectedRestaurantId.set(res.value[0].id);
                        this.loadMenus(res.value[0].id);
                    }
                }
            },
        });
    }

    protected onRestaurantChange(id: number | null): void {
        this.selectedRestaurantId.set(id);
        this.selectedMenuId.set(null);
        this.menus.set([]);
        if (id != null) this.loadMenus(id);
    }

    private loadMenus(restaurantId: number): void {
        this.loadingMenus.set(true);
        this.menuService
            .getByRestaurant(restaurantId)
            .pipe(finalize(() => this.loadingMenus.set(false)))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.menus.set(res.value);
                        if (res.value.length > 0 && this.selectedMenuId() === null) {
                            this.selectedMenuId.set(res.value[0].id);
                        }
                    }
                },
            });
    }

    protected selectMenu(id: number): void {
        this.selectedMenuId.set(id);
    }

    openCreateMenu(): void {
        this.editingMenu = null;
        this.menuForm.reset({
            name: '',
            description: '',
            imageUrl: '',
            bannerImageUrl: '',
            sortOrder: 0,
            isActive: true,
            isPublished: true,
            startDate: null,
            endDate: null,
        });
        this.menuDialog.set(true);
    }

    openEditMenu(menu: MenuDTO): void {
        this.editingMenu = menu;
        this.menuForm.reset({
            name: menu.name,
            description: menu.description ?? '',
            imageUrl: menu.imageUrl ?? '',
            bannerImageUrl: menu.bannerImageUrl ?? '',
            sortOrder: menu.sortOrder,
            isActive: menu.isActive,
            isPublished: menu.isPublished,
            startDate: menu.startDate ? new Date(menu.startDate) : null,
            endDate: menu.endDate ? new Date(menu.endDate) : null,
        });
        this.menuDialog.set(true);
    }

    saveMenu(): void {
        if (this.menuForm.invalid) {
            this.menuForm.markAllAsTouched();
            return;
        }
        const restaurantId = this.selectedRestaurantId();
        if (restaurantId == null) return;

        const v = this.menuForm.value;

        this.loadingService.start(SAVE_MENU_KEY);
        const stop = () => this.loadingService.stop(SAVE_MENU_KEY);

        if (this.editingMenu) {
            const payload: UpdateMenuDTO = {
                name: v.name.trim(),
                description: this.trimOrNull(v.description),
                imageUrl: this.trimOrNull(v.imageUrl),
                bannerImageUrl: this.trimOrNull(v.bannerImageUrl),
                sortOrder: v.sortOrder ?? 0,
                isActive: !!v.isActive,
                isPublished: !!v.isPublished,
                startDate: v.startDate ? new Date(v.startDate).toISOString() : null,
                endDate: v.endDate ? new Date(v.endDate).toISOString() : null,
            };

            this.menuService
                .update(this.editingMenu.id, payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onMenuSaved(res, 'Menu updated'),
                    error: (err) => this.errorToast(err, 'Could not update menu'),
                });
        } else {
            const payload: CreateMenuDTO = {
                restaurantId,
                name: v.name.trim(),
                description: this.trimOrNull(v.description),
                imageUrl: this.trimOrNull(v.imageUrl),
                bannerImageUrl: this.trimOrNull(v.bannerImageUrl),
                sortOrder: v.sortOrder ?? 0,
                isActive: !!v.isActive,
                isPublished: !!v.isPublished,
                startDate: v.startDate ? new Date(v.startDate).toISOString() : null,
                endDate: v.endDate ? new Date(v.endDate).toISOString() : null,
            };

            this.menuService
                .create(payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onMenuSaved(res, 'Menu created'),
                    error: (err) => this.errorToast(err, 'Could not create menu'),
                });
        }
    }

    private onMenuSaved(res: Result<MenuDTO>, title: string): void {
        if (res.isSuccess) {
            this.messageService.add({ severity: 'success', summary: title, detail: res.value.name, life: 2500 });
            this.menuDialog.set(false);
            this.selectedMenuId.set(res.value.id);
            const restaurantId = this.selectedRestaurantId();
            if (restaurantId != null) this.loadMenus(restaurantId);
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.error ?? title, life: 3000 });
        }
    }

    deleteMenu(menu: MenuDTO): void {
        this.confirmationService.confirm({
            header: 'Delete menu?',
            message: `Delete "${menu.name}" and everything in it?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.menuService.delete(menu.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Menu deleted',
                                life: 2000,
                            });
                            if (this.selectedMenuId() === menu.id) this.selectedMenuId.set(null);
                            const rId = this.selectedRestaurantId();
                            if (rId != null) this.loadMenus(rId);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: res.error ?? 'Could not delete',
                                life: 3000,
                            });
                        }
                    },
                });
            },
        });
    }

    openCreateCategory(): void {
        this.editingCategory = null;
        this.categoryForm.reset({
            name: '',
            description: '',
            imageUrl: '',
            icon: '',
            sortOrder: 0,
            isActive: true,
        });
        this.categoryDialog.set(true);
    }

    openEditCategory(category: MenuCategoryDTO): void {
        this.editingCategory = category;
        this.categoryForm.reset({
            name: category.name,
            description: category.description ?? '',
            imageUrl: category.imageUrl ?? '',
            icon: category.icon ?? '',
            sortOrder: category.sortOrder,
            isActive: category.isActive,
        });
        this.categoryDialog.set(true);
    }

    saveCategory(): void {
        if (this.categoryForm.invalid) {
            this.categoryForm.markAllAsTouched();
            return;
        }
        const menu = this.selectedMenu();
        if (!menu) return;

        const v = this.categoryForm.value;

        this.loadingService.start(SAVE_CATEGORY_KEY);
        const stop = () => this.loadingService.stop(SAVE_CATEGORY_KEY);

        if (this.editingCategory) {
            const payload: UpdateMenuCategoryDTO = {
                name: v.name.trim(),
                description: this.trimOrNull(v.description),
                imageUrl: this.trimOrNull(v.imageUrl),
                icon: this.trimOrNull(v.icon),
                sortOrder: v.sortOrder ?? 0,
                isActive: !!v.isActive,
            };

            this.menuService
                .updateCategory(this.editingCategory.id, payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onCategorySaved(res, 'Category updated'),
                    error: (err) => this.errorToast(err, 'Could not update category'),
                });
        } else {
            const payload: CreateMenuCategoryDTO = {
                menuId: menu.id,
                name: v.name.trim(),
                description: this.trimOrNull(v.description),
                imageUrl: this.trimOrNull(v.imageUrl),
                icon: this.trimOrNull(v.icon),
                sortOrder: v.sortOrder ?? 0,
                isActive: !!v.isActive,
            };

            this.menuService
                .createCategory(payload)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onCategorySaved(res, 'Category created'),
                    error: (err) => this.errorToast(err, 'Could not create category'),
                });
        }
    }

    private onCategorySaved(res: Result<MenuCategoryDTO>, title: string): void {
        if (res.isSuccess) {
            this.messageService.add({ severity: 'success', summary: title, detail: res.value.name, life: 2500 });
            this.categoryDialog.set(false);
            const rId = this.selectedRestaurantId();
            if (rId != null) this.loadMenus(rId);
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.error ?? title, life: 3000 });
        }
    }

    deleteCategory(category: MenuCategoryDTO): void {
        this.confirmationService.confirm({
            header: 'Delete category?',
            message: `Delete "${category.name}" and all of its items?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.menuService.deleteCategory(category.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Category deleted',
                                life: 2000,
                            });
                            const rId = this.selectedRestaurantId();
                            if (rId != null) this.loadMenus(rId);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: res.error ?? 'Could not delete',
                                life: 3000,
                            });
                        }
                    },
                });
            },
        });
    }

    openCreateItem(category: MenuCategoryDTO): void {
        this.editingItem = null;
        this.itemParentCategoryId = category.id;
        this.itemForm.reset({
            name: '',
            shortDescription: '',
            description: '',
            imageUrl: '',
            thumbnailUrl: '',
            price: 0,
            discountedPrice: null,
            calories: null,
            preparationTimeMinutes: null,
            servingSizeGrams: null,
            spicinessLevel: 0,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isDairyFree: false,
            isHalal: false,
            isKosher: false,
            isFeatured: false,
            isNew: false,
            isAvailable: true,
            isActive: true,
            stockQuantity: null,
            sortOrder: 0,
            allergensCsv: '',
            tagsCsv: '',
            ingredientsCsv: '',
        });
        this.editingItemGroups.set([]);
        this.editingGroupId.set(null);
        this.editingModifierId.set(null);
        this.newGroupName.set('');
        this.newGroupMin.set(0);
        this.newGroupMax.set(1);
        this.newModifierName.set({});
        this.newModifierPrice.set({});
        this.itemDialog.set(true);
    }

    openEditItem(item: MenuItemDTO): void {
        this.editingItem = item;
        this.itemParentCategoryId = item.menuCategoryId;
        this.itemForm.reset({
            name: item.name,
            shortDescription: item.shortDescription ?? '',
            description: item.description ?? '',
            imageUrl: item.imageUrl ?? '',
            thumbnailUrl: item.thumbnailUrl ?? '',
            price: item.price,
            discountedPrice: item.discountedPrice,
            calories: item.calories,
            preparationTimeMinutes: item.preparationTimeMinutes,
            servingSizeGrams: item.servingSizeGrams,
            spicinessLevel: item.spicinessLevel,
            isVegetarian: item.isVegetarian,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            isDairyFree: item.isDairyFree,
            isHalal: item.isHalal,
            isKosher: item.isKosher,
            isFeatured: item.isFeatured,
            isNew: item.isNew,
            isAvailable: item.isAvailable,
            isActive: item.isActive,
            stockQuantity: item.stockQuantity,
            sortOrder: item.sortOrder,
            allergensCsv: (item.allergens ?? []).join(', '),
            tagsCsv: (item.tags ?? []).join(', '),
            ingredientsCsv: (item.ingredients ?? []).join(', '),
        });
        this.editingItemGroups.set([...(item.modifierGroups ?? [])]);
        this.editingGroupId.set(null);
        this.editingModifierId.set(null);
        this.itemDialog.set(true);
    }

    saveItem(): void {
        if (this.itemForm.invalid) {
            this.itemForm.markAllAsTouched();
            return;
        }
        const categoryId = this.itemParentCategoryId;
        if (categoryId == null) return;

        const v = this.itemForm.value;

        const basePayload = {
            menuCategoryId: categoryId,
            name: v.name.trim(),
            shortDescription: this.trimOrNull(v.shortDescription),
            description: this.trimOrNull(v.description),
            imageUrl: this.trimOrNull(v.imageUrl),
            thumbnailUrl: this.trimOrNull(v.thumbnailUrl),
            price: Number(v.price) || 0,
            discountedPrice: v.discountedPrice ?? null,
            calories: v.calories ?? null,
            preparationTimeMinutes: v.preparationTimeMinutes ?? null,
            servingSizeGrams: v.servingSizeGrams ?? null,
            spicinessLevel: Number(v.spicinessLevel) || 0,
            isVegetarian: !!v.isVegetarian,
            isVegan: !!v.isVegan,
            isGlutenFree: !!v.isGlutenFree,
            isDairyFree: !!v.isDairyFree,
            isHalal: !!v.isHalal,
            isKosher: !!v.isKosher,
            isFeatured: !!v.isFeatured,
            isNew: !!v.isNew,
            isAvailable: !!v.isAvailable,
            isActive: !!v.isActive,
            stockQuantity: v.stockQuantity ?? null,
            sortOrder: v.sortOrder ?? 0,
            allergens: this.csvToList(v.allergensCsv),
            tags: this.csvToList(v.tagsCsv),
            ingredients: this.csvToList(v.ingredientsCsv),
        } satisfies CreateMenuItemDTO;

        this.loadingService.start(SAVE_ITEM_KEY);
        const stop = () => this.loadingService.stop(SAVE_ITEM_KEY);

        if (this.editingItem) {
            this.menuService
                .updateItem(this.editingItem.id, basePayload as UpdateMenuItemDTO)
                .pipe(finalize(stop))
                .subscribe({
                    next: (res) => this.onItemSaved(res, 'Item updated'),
                    error: (err) => this.errorToast(err, 'Could not update item'),
                });
        } else {
            this.createItemWithDraftGroups(basePayload).finally(stop);
        }
    }

    private async createItemWithDraftGroups(payload: CreateMenuItemDTO): Promise<void> {
        try {
            const itemRes = await firstValueFrom(this.menuService.createItem(payload));
            if (!itemRes.isSuccess) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: itemRes.error ?? 'Could not create item',
                    life: 3000,
                });
                return;
            }

            const itemId = itemRes.value.id;
            const drafts = this.editingItemGroups();

            for (const draft of drafts) {
                const groupRes = await firstValueFrom(
                    this.menuService.createModifierGroup({
                        menuItemId: itemId,
                        name: draft.name,
                        minSelect: draft.minSelect,
                        maxSelect: draft.maxSelect,
                        sortOrder: draft.sortOrder,
                        isActive: draft.isActive,
                    }),
                );
                if (!groupRes.isSuccess) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Group failed',
                        detail: `${draft.name}: ${groupRes.error ?? 'unknown error'}`,
                        life: 3000,
                    });
                    continue;
                }

                for (const opt of draft.modifiers) {
                    await firstValueFrom(
                        this.menuService.createModifier({
                            menuItemModifierGroupId: groupRes.value.id,
                            name: opt.name,
                            priceDelta: opt.priceDelta,
                            isActive: opt.isActive,
                            sortOrder: opt.sortOrder,
                        }),
                    );
                }
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Item created',
                detail: itemRes.value.name,
                life: 2500,
            });
            this.itemDialog.set(false);
            const rId = this.selectedRestaurantId();
            if (rId != null) this.loadMenus(rId);
        } catch (err) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Could not finish creating item',
                life: 3000,
            });
        }
    }

    private onItemSaved(res: Result<MenuItemDTO>, title: string): void {
        if (res.isSuccess) {
            this.messageService.add({ severity: 'success', summary: title, detail: res.value.name, life: 2500 });
            this.itemDialog.set(false);
            const rId = this.selectedRestaurantId();
            if (rId != null) this.loadMenus(rId);
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.error ?? title, life: 3000 });
        }
    }

    deleteItem(item: MenuItemDTO): void {
        this.confirmationService.confirm({
            header: 'Delete item?',
            message: `Delete "${item.name}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.menuService.deleteItem(item.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Item deleted',
                                life: 2000,
                            });
                            const rId = this.selectedRestaurantId();
                            if (rId != null) this.loadMenus(rId);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: res.error ?? 'Could not delete',
                                life: 3000,
                            });
                        }
                    },
                });
            },
        });
    }

    protected isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    private errorToast(err: HttpErrorResponse, fallback: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error ?? fallback,
            life: 3000,
        });
    }

    private trimOrNull(value: string | null | undefined): string | null {
        if (value === null || value === undefined) return null;
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
    }

    private csvToList(value: string | null | undefined): string[] {
        if (!value) return [];
        return value
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    protected getModName(groupId: number): string {
        return this.newModifierName()[groupId] ?? '';
    }

    protected getModPrice(groupId: number): number {
        return this.newModifierPrice()[groupId] ?? 0;
    }

    protected setModName(groupId: number, value: string): void {
        this.newModifierName.update((m) => ({ ...m, [groupId]: value }));
    }

    protected setModPrice(groupId: number, value: number): void {
        this.newModifierPrice.update((m) => ({ ...m, [groupId]: value }));
    }

    addModifierGroup(): void {
        const name = this.newGroupName().trim();
        if (!name) return;
        const min = Math.max(0, this.newGroupMin());
        const max = Math.max(1, this.newGroupMax());
        if (min > max) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Min cannot exceed max',
                life: 3000,
            });
            return;
        }

        const resetInputs = () => {
            this.newGroupName.set('');
            this.newGroupMin.set(0);
            this.newGroupMax.set(1);
        };

        if (!this.editingItem) {
            const tempId = -(Date.now() + Math.floor(Math.random() * 1000));
            const draft: MenuItemModifierGroupDTO = {
                id: tempId,
                menuItemId: 0,
                name,
                minSelect: min,
                maxSelect: max,
                sortOrder: this.editingItemGroups().length,
                isActive: true,
                modifiers: [],
            };
            this.editingItemGroups.update((groups) => [...groups, draft]);
            resetInputs();
            return;
        }

        const dto: CreateMenuItemModifierGroupDTO = {
            menuItemId: this.editingItem.id,
            name,
            minSelect: min,
            maxSelect: max,
            sortOrder: this.editingItemGroups().length,
            isActive: true,
        };

        this.menuService.createModifierGroup(dto).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.editingItemGroups.update((groups) => [
                        ...groups,
                        { ...res.value, modifiers: [] },
                    ]);
                    resetInputs();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not create group',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => this.errorToast(err, 'Could not create group'),
        });
    }

    startEditGroup(group: MenuItemModifierGroupDTO): void {
        this.editingGroupId.set(group.id);
        this.editingGroupName.set(group.name);
        this.editingGroupMin.set(group.minSelect);
        this.editingGroupMax.set(group.maxSelect);
    }

    cancelEditGroup(): void {
        this.editingGroupId.set(null);
    }

    saveEditGroup(group: MenuItemModifierGroupDTO): void {
        const name = this.editingGroupName().trim();
        if (!name) return;
        const min = Math.max(0, this.editingGroupMin());
        const max = Math.max(1, this.editingGroupMax());
        if (min > max) return;

        if (group.id < 0) {
            this.editingItemGroups.update((groups) =>
                groups.map((g) =>
                    g.id === group.id
                        ? { ...g, name, minSelect: min, maxSelect: max }
                        : g,
                ),
            );
            this.editingGroupId.set(null);
            return;
        }

        const dto: UpdateMenuItemModifierGroupDTO = {
            name,
            minSelect: min,
            maxSelect: max,
            sortOrder: group.sortOrder,
            isActive: group.isActive,
        };

        this.menuService.updateModifierGroup(group.id, dto).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.editingItemGroups.update((groups) =>
                        groups.map((g) =>
                            g.id === group.id ? { ...g, ...res.value, modifiers: g.modifiers } : g,
                        ),
                    );
                    this.editingGroupId.set(null);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not update group',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => this.errorToast(err, 'Could not update group'),
        });
    }

    deleteModifierGroup(group: MenuItemModifierGroupDTO): void {
        this.confirmationService.confirm({
            header: 'Delete group?',
            message: `Delete "${group.name}" and all its options?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (group.id < 0) {
                    this.editingItemGroups.update((groups) =>
                        groups.filter((g) => g.id !== group.id),
                    );
                    return;
                }
                this.menuService.deleteModifierGroup(group.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.editingItemGroups.update((groups) =>
                                groups.filter((g) => g.id !== group.id),
                            );
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: res.error ?? 'Could not delete group',
                                life: 3000,
                            });
                        }
                    },
                    error: (err: HttpErrorResponse) =>
                        this.errorToast(err, 'Could not delete group'),
                });
            },
        });
    }

    addModifier(group: MenuItemModifierGroupDTO): void {
        const name = this.getModName(group.id).trim();
        if (!name) return;
        const price = Math.max(0, this.getModPrice(group.id) ?? 0);

        if (group.id < 0) {
            const tempId = -(Date.now() + Math.floor(Math.random() * 1000));
            const draft: MenuItemModifierDTO = {
                id: tempId,
                menuItemModifierGroupId: group.id,
                name,
                priceDelta: price,
                isActive: true,
                sortOrder: group.modifiers.length,
            };
            this.editingItemGroups.update((groups) =>
                groups.map((g) =>
                    g.id === group.id ? { ...g, modifiers: [...g.modifiers, draft] } : g,
                ),
            );
            this.setModName(group.id, '');
            this.setModPrice(group.id, 0);
            return;
        }

        const dto: CreateMenuItemModifierDTO = {
            menuItemModifierGroupId: group.id,
            name,
            priceDelta: price,
            isActive: true,
            sortOrder: group.modifiers.length,
        };

        this.menuService.createModifier(dto).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.editingItemGroups.update((groups) =>
                        groups.map((g) =>
                            g.id === group.id
                                ? { ...g, modifiers: [...g.modifiers, res.value] }
                                : g,
                        ),
                    );
                    this.setModName(group.id, '');
                    this.setModPrice(group.id, 0);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not create option',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => this.errorToast(err, 'Could not create option'),
        });
    }

    startEditModifier(modifier: MenuItemModifierDTO): void {
        this.editingModifierId.set(modifier.id);
        this.editingModifierName.set(modifier.name);
        this.editingModifierPrice.set(modifier.priceDelta);
    }

    cancelEditModifier(): void {
        this.editingModifierId.set(null);
    }

    saveEditModifier(modifier: MenuItemModifierDTO): void {
        const name = this.editingModifierName().trim();
        if (!name) return;
        const price = Math.max(0, this.editingModifierPrice());

        if (modifier.id < 0) {
            this.editingItemGroups.update((groups) =>
                groups.map((g) => ({
                    ...g,
                    modifiers: g.modifiers.map((m) =>
                        m.id === modifier.id ? { ...m, name, priceDelta: price } : m,
                    ),
                })),
            );
            this.editingModifierId.set(null);
            return;
        }

        const dto: UpdateMenuItemModifierDTO = {
            name,
            priceDelta: price,
            isActive: modifier.isActive,
            sortOrder: modifier.sortOrder,
        };

        this.menuService.updateModifier(modifier.id, dto).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.editingItemGroups.update((groups) =>
                        groups.map((g) => ({
                            ...g,
                            modifiers: g.modifiers.map((m) =>
                                m.id === modifier.id ? res.value : m,
                            ),
                        })),
                    );
                    this.editingModifierId.set(null);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.error ?? 'Could not update option',
                        life: 3000,
                    });
                }
            },
            error: (err: HttpErrorResponse) => this.errorToast(err, 'Could not update option'),
        });
    }

    deleteModifier(modifier: MenuItemModifierDTO): void {
        this.confirmationService.confirm({
            header: 'Delete option?',
            message: `Delete "${modifier.name}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (modifier.id < 0) {
                    this.editingItemGroups.update((groups) =>
                        groups.map((g) => ({
                            ...g,
                            modifiers: g.modifiers.filter((m) => m.id !== modifier.id),
                        })),
                    );
                    return;
                }
                this.menuService.deleteModifier(modifier.id).subscribe({
                    next: (res) => {
                        if (res.isSuccess) {
                            this.editingItemGroups.update((groups) =>
                                groups.map((g) => ({
                                    ...g,
                                    modifiers: g.modifiers.filter((m) => m.id !== modifier.id),
                                })),
                            );
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: res.error ?? 'Could not delete option',
                                life: 3000,
                            });
                        }
                    },
                    error: (err: HttpErrorResponse) =>
                        this.errorToast(err, 'Could not delete option'),
                });
            },
        });
    }
}
