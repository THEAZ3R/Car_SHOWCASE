import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login'; // ✅ Changed from 'Login'

describe('LoginPage', () => { // ✅ Changed from 'Login'
  let component: LoginPage;    // ✅ Changed from 'Login'
  let fixture: ComponentFixture<LoginPage>; // ✅ Changed from 'Login'

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage] // ✅ Changed from 'Login'
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPage); // ✅ Changed
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});