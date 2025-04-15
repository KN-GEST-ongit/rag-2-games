import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { NgOptimizedImage } from '@angular/common';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, NgOptimizedImage, RouterTestingModule], // Import komponentu standalone
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct footer links', () => {
    const footerElement = fixture.nativeElement as HTMLElement;

    const authorLinks = footerElement.querySelectorAll(
      'a[href^="https://github.com/"]'
    );
    expect(authorLinks.length).toBe(component.authors.length);
    component.authors.forEach((author, index) => {
      expect(authorLinks[index].textContent).toContain(author.name);
      expect(authorLinks[index].getAttribute('href')).toBe(
        `https://github.com/${author.githubName}`
      );
    });
  });

  it('should display images with correct src attributes', () => {
    const imageElements = fixture.debugElement.queryAll(By.css('img'));
    const expectedSrcs = [
      'images/rag-2.png',
      'images/prz/prz_orange.png',
      'images/gest/gest_orange.png',
    ];

    expectedSrcs.forEach((src, index) => {
      expect(imageElements[index].nativeElement.getAttribute('ngSrc')).toBe(
        src
      );
    });
  });
});
