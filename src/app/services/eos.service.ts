import { Injectable } from '@angular/core';
import * as Eos from 'eosjs';
import { environment } from '../../environments/environment';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Block } from '../models/Block';

@Injectable()
export class EosService {
  public eos: any;

  constructor() {
    this.eos = Eos({
      httpEndpoint: environment.blockchainUrl,
      blockId: environment.chainId
    });
  }

  getAccount(name: string): Observable<any> {
    return from(this.eos.getAccount(name));
  }

  getBlock(id: string | number): Observable<Block> {
    return from(this.eos.getBlock(id)).pipe(
      map((blockRaw: any) => {
        return <Block>{
          actionMerkleRoot: blockRaw.action_mroot,
          blockNumber: blockRaw.block_num,
          confirmed: blockRaw.confirmed,
          id: blockRaw.id,
          newProducers: blockRaw.new_producers,
          numTransactions: blockRaw.transactions.length,
          prevBlockId: blockRaw.previous,
          producer: blockRaw.producer,
          timestamp: new Date(blockRaw.timestamp).getTime(),
          transactionMerkleRoot: blockRaw.transaction_mroot,
          version: blockRaw.schedule_version
        };
      })
    );
  }

  getCurrencyBalance(name: string): Observable<number> {
    return from(this.eos.getCurrencyBalance('eosio.token', name, 'EOS')).pipe(
      map(result => {
        if (result && result[0]) {
          return parseFloat(result[0].replace(' EOS', ''));
        }
        return 0;
      })
    );
  }

  getRamPrice(): Observable<number> {
    return from(this.eos.getTableRows({
      json: true,
      code: "eosio",
      scope: "eosio",
      table: "rammarket",
      limit: 1
    })).pipe(
      map((result: any) => {
        let base = parseFloat(result.rows[0].base.balance.replace(' RAM', ''));
        let quote = parseFloat(result.rows[0].quote.balance.replace(' EOS', ''));
        return quote / base;
      })
    );
  }

  getProducers() {
    return from(this.eos.getTableRows({
      json: true,
      code: "eosio",
      scope: "eosio",
      table: "producers",
      limit: 700,
      table_key: ""
    })).pipe(
      map((result: any) => {
        return result.rows
          .map(row => ({ ...row, total_votes: parseFloat(row.total_votes) }))
          .sort((a, b) => b.total_votes - a.total_votes);
      })
    );
  }

  getChainStatus() {
    return from(this.eos.getTableRows({
      json: true,
      code: "eosio",
      scope: "eosio",
      table: "global",
      limit: 1
    })).pipe(
      map((result: any) => result.rows[0])
    );
  }
}
