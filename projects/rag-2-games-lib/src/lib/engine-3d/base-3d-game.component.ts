import { AfterViewInit, ChangeDetectionStrategy, OnDestroy, Component } from '@angular/core';
import { BaseGameWindowComponent } from '../games/base-game.component';
import { Base3DRenderer } from './base-3d.renderer';

@Component({
    standalone: true,
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export abstract class Base3DGameWindowComponent 
    extends BaseGameWindowComponent 
    implements AfterViewInit, OnDestroy 
{
    protected renderer3D?: Base3DRenderer;

    public override ngAfterViewInit(): void {
        super.ngAfterViewInit();
        setTimeout(() => {
            this.initBabylon();
        }, 300);
    }

    private initBabylon(): void {
        try {
        this.renderer3D = this.createRenderer(this._canvas);
        } catch (error) {
            console.error('Babylon.js initialization failed: ', error);
        }
    }

    protected abstract createRenderer(canvas: HTMLCanvasElement): Base3DRenderer;

    public override ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.renderer3D) {
            this.renderer3D.dispose();
        }
    }
}