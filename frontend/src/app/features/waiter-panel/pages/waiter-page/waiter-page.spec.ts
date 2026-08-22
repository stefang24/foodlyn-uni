import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaiterPage } from './waiter-page';

describe('WaiterPage', () => {
    let component: WaiterPage;
    let fixture: ComponentFixture<WaiterPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaiterPage],
        }).compileComponents();

        fixture = TestBed.createComponent(WaiterPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
