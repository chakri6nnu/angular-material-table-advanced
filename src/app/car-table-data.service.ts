import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarTableDataService {
  private mockData = {
    data: [
      {
        vin: 'WVWAA71K08W201030',
        brand: 'Volkswagen',
        year: 2008,
        color: 'Blue',
      },
      { vin: '1HGBH41JXMN109186', brand: 'Honda', year: 2019, color: 'Red' },
      { vin: '1HGBH41JXMN109187', brand: 'Honda', year: 2020, color: 'Black' },
      { vin: '1HGBH41JXMN109188', brand: 'Honda', year: 2021, color: 'White' },
      { vin: '5YJSA1E14HF000000', brand: 'Tesla', year: 2017, color: 'Red' },
      { vin: '5YJSA1E14HF000001', brand: 'Tesla', year: 2018, color: 'Black' },
      { vin: '5YJSA1E14HF000002', brand: 'Tesla', year: 2019, color: 'White' },
      { vin: '1FTFW1ET5DFC12345', brand: 'Ford', year: 2013, color: 'Blue' },
      { vin: '1FTFW1ET5DFC12346', brand: 'Ford', year: 2014, color: 'Red' },
      { vin: '1FTFW1ET5DFC12347', brand: 'Ford', year: 2015, color: 'Silver' },
      { vin: 'JN1AZ4EH8FM123456', brand: 'Nissan', year: 2015, color: 'Black' },
      { vin: 'JN1AZ4EH8FM123457', brand: 'Nissan', year: 2016, color: 'White' },
      { vin: 'WBA3A5C58EF123456', brand: 'BMW', year: 2014, color: 'Blue' },
      {
        vin: 'WBA3A5C58EF123457',
        brand: 'BMW',
        year: 2015,
        color: 'Black',
        disable: true,
      },
      {
        vin: 'WBA3A5C58EF123458',
        brand: 'BMW',
        year: 2016,
        color: 'Silver',
        isDupicate: true,
      },
    ],
  };

  getAllData(): Observable<any> {
    return of(this.mockData);
  }
}
