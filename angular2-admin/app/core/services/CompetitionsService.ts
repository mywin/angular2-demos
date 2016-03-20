import {Injectable, EventEmitter} from "angular2/core";
import {Http, Headers} from "angular2/http";
import {Observable} from "rxjs/Observable";
import {Competition} from "../domain/Competition";
import {Subject} from "rxjs/Subject";
import {Status} from "../domain/Status";
import {ID} from "../domain/ID";
import "rxjs/add/operator/share";
import "rxjs/Rx";
// import 'rxjs/add/operator/share';
// import 'rxjs/add/operator/map';
// import 'rxjs/operator/delay';
// import 'rxjs/operator/mergeMap';
// import 'rxjs/operator/switchMap';

@Injectable()
export class CompetitionsService {

    /** Internal model state */
    private competitions:Competition[];

    /**
     * Public Publisher - async = true
     * @deprecated
     */
    onCompetitionsChanged = new EventEmitter<Competition[]>(true);

    /** Private Observable **/
    private _competitionsSource:Subject<Competition[]> = new Subject<Competition[]>();

    /** Public Observer  **/
    competitionsChanged$:Observable<Competition[]> = this._competitionsSource.asObservable().share(); // share() = This will allow multiple Subscribers to one Observable

    constructor(private _http:Http) {
        // Get the data on creation
        _http.get('http://localhost:8080/competitions')
            .map(res => res.json())
            .subscribe(
                data => {
                    this.parseCompetitions(data);
                    this.triggerCompetitionsChanged();
                    this.publishToObservers();
                },
                err => console.error('Failed to load competitions', err),
                () => console.log('Loaded competitions')
            );
    }

    private publishToObservers():void {
        this._competitionsSource.next(this.competitions); // Push a new copy to all Subscribers.
    }

    /** @deprecated */
    private triggerCompetitionsChanged():void {
        this.onCompetitionsChanged.emit(this.competitions);
    }

    private parseCompetitions(competitions:Object[]):void {
        this.competitions = competitions.map(function (competition) {
            return new Competition().fromJson(competition);
        });
        console.log('Parsed competitions', this.competitions);
    }

    public updateStatus(compId:ID, status:Status):void {
        var compIdx = this.competitions.findIndex((comp:Competition) => {
            return comp._id == compId;
        });

        if (compId) {

            var headers = new Headers();
            headers.append('Content-Type', 'application/json');

            var payload = {
                status: status
            };


            this._http.put('http://localhost:8080/competition/status/' + compId.toString(), JSON.stringify(payload), {
                    headers: headers
                })
                // FIXME -> toPromise() should have worked, fallen back to subscribe...
                //.toPromise()
                //.then((res) => {
                //    console.error('Successfully saved status', res);
                //    this.competitions[compIdx].status = status;
                //    this.publishToObservers();
                //})
                //.catch((err) => {
                //    console.error('Unable to set status', err);
                //})
                .subscribe(
                    res => {
                        console.info('Successfully updated status', res);
                        this.competitions[compIdx].status = status;
                        this.publishToObservers();
                    },
                    err => console.error('Failed to update status', err)
                );
        }
    }
}