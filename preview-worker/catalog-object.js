import {DurableObject} from 'cloudflare:workers';
import {decodeCatalogState} from '../web/src/catalog/chainDecoder.ts';
import {createSqlCatalog} from './catalog-store.js';
export class PublicCatalog extends DurableObject {
  constructor(ctx,env){super(ctx,env);ctx.blockConcurrencyWhile(async()=>{this.store=createSqlCatalog(ctx.storage.sql,decodeCatalogState);});}
  catalog(contract){return this.store.catalog(contract);}
  metadata(){return this.store.metadata();}
  publish(write,state){return this.store.publish(write,state);}
}
