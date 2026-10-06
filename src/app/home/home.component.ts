import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CoinService } from '../AuthService/coin.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '../shared/loading.service';
import { AVAILABLE_COUNTRIES_CAD, CountryCAD } from '../models/countriesCAD';
import { CoinRecognitionService } from '../AuthService/recognition.service';
import { PlanoService } from '../AuthService/planos.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  coins: any[] = [];
  filteredCoins: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 24;
  searchName: string = '';
  selectedCategory: string = '';
  minYear: number | null = null;
  maxYear: number | null = null;
  coinsLoaded = false;
  queryParamsInitialized = false;
  initialFiltersApplied = false;

  coin: any;
  coinEntries: { year: number; quantity: number | null; condition: string | null, id: number, type: string }[] = [];
  showModal = false;

  selectedIssuer: string = '';
  selectedCountry: string = 'Brasil';
  availableCountries: CountryCAD[] = AVAILABLE_COUNTRIES_CAD;
  uniqueCategories: string[] = [
    'coin',
    'banknote'
  ];

  showFilters = false;

  total = 0;

  totalPages = 1;

  @ViewChild('video', { static: false }) video!: ElementRef<HTMLVideoElement>;
  stream: MediaStream | null = null;
  cameraModalOpen = false;

  constructor(
    private coinService: CoinService,
    private router: Router,
    private route: ActivatedRoute,
    private loading: LoadingService,
    private recognitionService: CoinRecognitionService,
    private planoService: PlanoService
  ) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(
      params => {

        this.queryParamsInitialized = true;
        this.searchName =
          params['searchName'] || '';

        this.selectedCategory =
          params['category'] || '';

        this.selectedIssuer =
          params['issuer'] || '';

        this.selectedCountry =
          params['country'] || 'Brasil';


        this.minYear =
          params['minYear']
            ? Number(params['minYear'])
            : null;


        this.maxYear =
          params['maxYear']
            ? Number(params['maxYear'])
            : null;

        this.currentPage =
          params['page']
            ? Number(params['page'])
            : 1;


        if (
          this.currentPage < 1
        ) {
          this.currentPage = 1;
        }

        this.loadCoins(
          this.selectedCountry,
          this.currentPage
        );
      }
    );
  }

  loadCoins(
    country: string,
    page: number = 1
  ): void {

    this.loading.show();
    this.coinsLoaded = false;
    this.coinService
      .getCoins(
        country,

        page,

        this.itemsPerPage,

        this.searchName,

        this.selectedCategory,

        this.minYear,

        this.maxYear
      )
      .subscribe({

        next: (response) => {
          this.currentPage =
            response.page;

          this.itemsPerPage =
            response.limit;

          this.total =
            response.total;

          this.totalPages =
            response.totalPages;

          this.coins =
            (response.data || []).map(
              (coin: any) => {

                const normalizedIssuer =
                  coin.issuer
                    ?.normalize('NFD')
                    .replace(
                      /[\u0300-\u036f]/g,
                      ''
                    )
                    .replace(
                      /\s+/g,
                      '-'
                    )
                    .replace(
                      /[^\w-]/g,
                      ''
                    );
                return {
                  ...coin,
                  categoryDisplay:
                    coin.category === 'coin'
                      ? 'Moeda'
                      : 'Cédula',

                  flagPath:
                    normalizedIssuer
                      ? `assets/img/bandeiras/bandeira-${normalizedIssuer}.png`
                      : null
                };
              }
            );
          this.coins.sort(
            (a, b) => {

              const yearA =
                a.min_year ??
                a.year ??
                0;

              const yearB =
                b.min_year ??
                b.year ??
                0;

              return yearA - yearB;
            }
          );
          this.filteredCoins =
            [...this.coins];
          this.coinsLoaded = true;
          this.loading.hide();
        },

        error: (err) => {
          console.error(
            'Erro ao carregar moedas:',
            err
          );
          this.coins = [];
          this.filteredCoins = [];
          this.total = 0;
          this.totalPages = 1;
          this.loading.hide();
        }
      });
  }

  changePage(
    page: number
  ): void {

    if (page < 1) {
      return;
    }

    if (
      page > this.totalPages
    ) {
      return;
    }

    if (
      page === this.currentPage
    ) {
      return;
    }


    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {
          page: page
        },

        queryParamsHandling: 'merge'
      }
    );
  }
  applyFilters(): void {
    this.currentPage = 1;
    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {

          page: 1,

          searchName:
            this.searchName || null,

          category:
            this.selectedCategory || null,

          minYear:
            this.minYear || null,

          maxYear:
            this.maxYear || null,

          country:
            this.selectedCountry || null
        },

        queryParamsHandling: 'merge'
      }
    );
  }

  clearFilters(): void {

    this.searchName = '';

    this.selectedCategory = '';

    this.minYear = null;

    this.maxYear = null;

    this.currentPage = 1;


    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {

          page: 1,

          searchName: null,

          category: null,

          minYear: null,

          maxYear: null
        },

        queryParamsHandling: 'merge'
      }
    );
  }

  onCountryChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    this.selectedCountry =
      select.value;


    this.currentPage = 1;


    this.router.navigate(
      [],
      {
        relativeTo: this.route,

        queryParams: {

          country:
            this.selectedCountry,

          page: 1,

          searchName:
            this.searchName || null,

          category:
            this.selectedCategory || null,

          minYear:
            this.minYear || null,

          maxYear:
            this.maxYear || null
        },

        queryParamsHandling: 'merge'
      }
    );
  }

  get paginatedCoins() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCoins.slice(start, end);
  }

  get uniqueIssuers(): string[] {
    return [...new Set(this.coins.map(c => c.issuer))];
  }

  verDetalhes(id: number) {
    this.router.navigate(['/coin', id], {
      queryParams: {
        searchName: this.searchName || null,
        issuer: this.selectedIssuer || null,
        category: this.selectedCategory || null,
        minYear: this.minYear != null ? this.minYear : null,
        maxYear: this.maxYear != null ? this.maxYear : null,
        page: this.currentPage
      }
    });
  }

  abrirModal(event: Event, itemId: number, type: 'coin' | 'banknote'): void {
    this.loading.show();
    event.preventDefault();
    event.stopPropagation();

    const element = event.target as HTMLElement;
    element.blur();

    this.coin = this.coins.find(c => c.id === itemId && c.type === type);

    if (!this.coin) {
      console.error('Item não encontrado no álbum:', { itemId, type });
      return;
    }

    this.coinEntries = [];
    const minYear = this.coin.min_year ?? this.coin.minYear ?? null;
    const maxYear = this.coin.max_year ?? this.coin.maxYear ?? null;
    const singleYear = this.coin.year ?? null;

    if (minYear != null && maxYear != null) {
      for (let y = minYear; y <= maxYear; y++) {
        this.coinEntries.push({ year: y, quantity: null, condition: null, id: this.coin.id, type: this.coin.type });
      }
    } else if (singleYear != null) {
      this.coinEntries.push({ year: singleYear, quantity: null, condition: null, id: this.coin.id, type: this.coin.type });
    }

    this.showModal = true;

    this.loading.hide();
  }

  getFlagCode(issuer: string): string {
    const found = AVAILABLE_COUNTRIES_CAD.find(c => c.name === issuer);
    return found ? found.code : 'un';
  }

  openCameraModal() {
    this.cameraModalOpen = true;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.stream = stream;
        this.video.nativeElement.srcObject = stream;
      })
      .catch(err => console.error("Erro ao acessar câmera:", err));
  }

  closeCameraModal() {
    this.cameraModalOpen = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  takePhoto() {
    this.loading.show();
    const video = this.video.nativeElement;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg");

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    const previewContainer = video.parentElement!;
    video.style.display = "none";

    let img = previewContainer.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      previewContainer.appendChild(img);
    }
    img.src = base64Image;
    img.style.width = "100%";
    img.style.height = "100%";

    this.loading.hide();

    this.sendToPython(base64Image);
  }

  sendToPython(base64Image: string) {
    this.loading.show();

    this.recognitionService.identifyCoin(base64Image).subscribe({
      next: (response: any) => {
        this.closeCameraModal();

        const coinId = response?.result?.best_match?.id;
        if (coinId) {
          this.router.navigate(['/coin', coinId]);
        } else {
          alert("Moeda identificada, mas sem ID!");
        }

        this.loading.hide();
      },
      error: (err: any) => {
        console.error("Erro no reconhecimento:", err);
        this.loading.hide();
      }
    });
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (this.video && this.video.nativeElement) {
        this.video.nativeElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      alert("Não foi possível acessar a câmera.");
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
