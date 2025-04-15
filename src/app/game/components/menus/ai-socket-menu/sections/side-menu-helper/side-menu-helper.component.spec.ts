import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SideMenuHelperComponent } from './side-menu-helper.component';
import { By } from '@angular/platform-browser';

describe('SideMenuHelperComponent', () => {
  let component: SideMenuHelperComponent;
  let fixture: ComponentFixture<SideMenuHelperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideMenuHelperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuHelperComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render menuType and descriptionPart1 correctly', () => {
    component.menuType = 'Main Menu';
    component.descriptionPart1 = 'Description part 1';
    component.descriptionPart2 = null;
    component.descriptionPart3 = null;
    fixture.detectChanges();

    const menuTypeElement = fixture.debugElement.query(
      By.css('p')
    ).nativeElement;
    expect(menuTypeElement.textContent).toContain('Main Menu');

    const descriptionPart1Element = fixture.debugElement.query(
      By.css('span p')
    ).nativeElement;
    expect(descriptionPart1Element.textContent).toContain('Description part 1');
  });

  it('should render descriptionPart2 and descriptionPart3 if provided', () => {
    component.menuType = 'Settings';
    component.descriptionPart1 = 'Description part 1';
    component.descriptionPart2 = 'Description part 2';
    component.descriptionPart3 = 'Description part 3';
    fixture.detectChanges();

    const descriptionParts = fixture.debugElement.queryAll(By.css('span p'));
    expect(descriptionParts.length).toBe(3);
    expect(descriptionParts[1].nativeElement.textContent).toContain(
      'Description part 2'
    );
    expect(descriptionParts[2].nativeElement.textContent).toContain(
      'Description part 3'
    );
  });

  it('should not render descriptionPart2 and descriptionPart3 if they are null', () => {
    component.menuType = 'Profile';
    component.descriptionPart1 = 'Only part 1 available';
    component.descriptionPart2 = null;
    component.descriptionPart3 = null;
    fixture.detectChanges();

    const descriptionParts = fixture.debugElement.queryAll(By.css('span p'));
    expect(descriptionParts.length).toBe(1);
    expect(descriptionParts[0].nativeElement.textContent).toContain(
      'Only part 1 available'
    );
  });
});
