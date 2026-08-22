import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusPage } from './order-status-page';

describe('OrderStatusPage', () => {
    let component: OrderStatusPage;
    let fixture: ComponentFixture<OrderStatusPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrderStatusPage],
        }).compileComponents();

        fixture = TestBed.createComponent(OrderStatusPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
