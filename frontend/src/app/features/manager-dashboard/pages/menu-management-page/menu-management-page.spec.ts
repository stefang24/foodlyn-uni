import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuManagementPage } from './menu-management-page';

describe('MenuManagementPage', () => {
    let component: MenuManagementPage;
    let fixture: ComponentFixture<MenuManagementPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MenuManagementPage],
        }).compileComponents();

        fixture = TestBed.createComponent(MenuManagementPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
