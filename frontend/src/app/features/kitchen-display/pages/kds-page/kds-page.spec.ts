import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KdsPage } from './kds-page';

describe('KdsPage', () => {
    let component: KdsPage;
    let fixture: ComponentFixture<KdsPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KdsPage],
        }).compileComponents();

        fixture = TestBed.createComponent(KdsPage);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
