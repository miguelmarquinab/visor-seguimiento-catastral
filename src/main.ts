import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

void (async () => { // NOSONAR: top-level await no es compatible con el target de navegadores actual.
  try {
    await bootstrapApplication(AppComponent, appConfig);
  } catch (err) {
    console.error(err);
  }
})();
