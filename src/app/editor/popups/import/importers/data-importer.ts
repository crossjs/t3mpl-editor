import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StateService } from 'src/app/editor/state.service';
import { TEMPLATE_DATA_FILE_NAME } from 't3mpl-core/core/constants';
import { DataSerializer } from 't3mpl-core/core/data/data-serializer';
import { MemoryStorage } from 't3mpl-core/core/memory-storage';

import { unzipToStorage } from './zip-utils';

@Injectable()
export class DataImporter {

	public constructor(
		private readonly stateService: StateService) {
	}

	public import(file: File): Observable<void> {
		return new Observable(r => {
			const contentStorage = new MemoryStorage();
			unzipToStorage(file, contentStorage).then(() => {
				try {
					const manifest = this.stateService.templateManifest;
					const dataSerializer = new DataSerializer();

					const dataRaw = contentStorage.getContent('text', TEMPLATE_DATA_FILE_NAME);
					const data = dataSerializer.deserialize(dataRaw);

					if (data.meta.name !== manifest.meta.name) {
						throw new Error(`The data file contains a wrong template name: ${data.meta.name}. Expected: ${manifest.meta.name}.`);
					}

					this.stateService.setState(
						this.stateService.templateManifest,
						this.stateService.templateStorage,
						contentStorage,
						data.configuration,
						data.data
					);
					r.next();
				} catch (e) {
					r.error(e);
				}
				r.complete();
			}, e => r.error(e));
		});
	}
}
