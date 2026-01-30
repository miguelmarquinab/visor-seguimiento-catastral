import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import {UbigeoFacade} from './ubigeo.facade';

export const ubigeoResolver: ResolveFn<void> = () => {
  const facade = inject(UbigeoFacade);
  facade.preload();
};

